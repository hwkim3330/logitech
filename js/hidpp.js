/**
 * Logitech OMM - HID++ 2.0 Protocol Implementation
 * WebHID API를 사용한 로지텍 마우스 통신
 */

class HidppDevice {
    constructor() {
        this.device = null;
        this.deviceIndex = HIDPP.DEVICE_WIRED;
        this.featureCache = new Map();
        this.pendingRequests = new Map();
        this.requestId = 0;
        this.debug = false;
    }

    /**
     * WebHID를 사용해 로지텍 마우스 연결
     */
    async connect() {
        if (!navigator.hid) {
            throw new Error('WebHID API가 지원되지 않습니다. Chrome 89+ 또는 Edge 89+를 사용하세요.');
        }

        try {
            // 지원되는 마우스 필터
            const filters = Object.keys(SUPPORTED_DEVICES).map(pid => ({
                vendorId: LOGITECH_VID,
                productId: parseInt(pid),
            }));

            // 추가적인 로지텍 장치 필터 (알려지지 않은 모델도 시도)
            filters.push({
                vendorId: LOGITECH_VID,
            });

            const devices = await navigator.hid.requestDevice({ filters });

            if (devices.length === 0) {
                throw new Error('장치가 선택되지 않았습니다.');
            }

            // 적합한 장치 찾기 (긴 리포트 지원하는 인터페이스 선호)
            let selectedDevice = null;

            for (const device of devices) {
                // 리포트 디스크립터 확인
                const hasLongReport = device.collections.some(col =>
                    col.outputReports?.some(r => r.reportId === HIDPP.REPORT_LONG) ||
                    col.featureReports?.some(r => r.reportId === HIDPP.REPORT_LONG)
                );

                if (hasLongReport || !selectedDevice) {
                    selectedDevice = device;
                    if (hasLongReport) break;
                }
            }

            this.device = selectedDevice || devices[0];

            if (!this.device.opened) {
                await this.device.open();
            }

            // 입력 리포트 핸들러 설정
            this.device.addEventListener('inputreport', (event) => {
                this.handleInputReport(event);
            });

            // 장치 인덱스 결정 (유선 vs 무선)
            await this.detectDeviceIndex();

            console.log('장치 연결됨:', this.device.productName);
            return this.getDeviceInfo();

        } catch (error) {
            console.error('연결 실패:', error);
            throw error;
        }
    }

    /**
     * 장치 연결 해제
     */
    async disconnect() {
        if (this.device && this.device.opened) {
            await this.device.close();
        }
        this.device = null;
        this.featureCache.clear();
    }

    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.device && this.device.opened;
    }

    /**
     * 장치 인덱스 감지 (유선/무선)
     */
    async detectDeviceIndex() {
        // 먼저 유선으로 시도
        this.deviceIndex = HIDPP.DEVICE_WIRED;
        try {
            await this.ping();
            return;
        } catch (e) {
            // 무선 수신기로 시도
        }

        // 무선 수신기 인덱스 1-6 시도
        for (let i = 1; i <= 6; i++) {
            this.deviceIndex = i;
            try {
                await this.ping();
                return;
            } catch (e) {
                continue;
            }
        }

        // 블루투스로 시도
        this.deviceIndex = HIDPP.DEVICE_BLUETOOTH;
        try {
            await this.ping();
            return;
        } catch (e) {
            // 기본값으로 유선 사용
            this.deviceIndex = HIDPP.DEVICE_WIRED;
        }
    }

    /**
     * 장치 ping
     */
    async ping() {
        const response = await this.callFeature(HIDPP.FEATURES.ROOT, 1, []);
        return response;
    }

    /**
     * HID++ 패킷 전송
     */
    async sendReport(reportId, data) {
        if (!this.isConnected()) {
            throw new Error('장치가 연결되지 않았습니다.');
        }

        // 리포트 크기에 맞게 패딩
        let reportSize;
        switch (reportId) {
            case HIDPP.REPORT_SHORT:
                reportSize = 6;
                break;
            case HIDPP.REPORT_LONG:
                reportSize = 19;
                break;
            case HIDPP.REPORT_VERY_LONG:
                reportSize = 63;
                break;
            default:
                reportSize = 19;
        }

        const paddedData = new Uint8Array(reportSize);
        paddedData.set(data.slice(0, reportSize));

        if (this.debug) {
            console.log('TX:', Array.from(paddedData).map(b => b.toString(16).padStart(2, '0')).join(' '));
        }

        await this.device.sendReport(reportId, paddedData);
    }

    /**
     * 입력 리포트 처리
     */
    handleInputReport(event) {
        const { reportId, data } = event;
        const dataArray = new Uint8Array(data.buffer);

        if (this.debug) {
            console.log('RX:', reportId.toString(16), Array.from(dataArray).map(b => b.toString(16).padStart(2, '0')).join(' '));
        }

        // HID++ 리포트 확인
        if (reportId !== HIDPP.REPORT_SHORT && reportId !== HIDPP.REPORT_LONG && reportId !== HIDPP.REPORT_VERY_LONG) {
            return;
        }

        const deviceIndex = dataArray[0];
        const featureIndex = dataArray[1];
        const funcIdSwId = dataArray[2];
        const swId = funcIdSwId & 0x0f;

        // 대기 중인 요청 확인
        const requestKey = `${deviceIndex}-${featureIndex}-${swId}`;
        const resolver = this.pendingRequests.get(requestKey);

        if (resolver) {
            this.pendingRequests.delete(requestKey);

            // 에러 체크 (0x8f = 에러 리포트)
            if (featureIndex === 0x8f) {
                const errorCode = dataArray[4];
                resolver.reject(new Error(`HID++ Error: ${this.getErrorMessage(errorCode)}`));
            } else {
                resolver.resolve(dataArray.slice(3));
            }
        }
    }

    /**
     * 에러 메시지 반환
     */
    getErrorMessage(code) {
        const messages = {
            [HIDPP.ERRORS.NO_ERROR]: '성공',
            [HIDPP.ERRORS.UNKNOWN]: '알 수 없는 오류',
            [HIDPP.ERRORS.INVALID_ARGUMENT]: '잘못된 인수',
            [HIDPP.ERRORS.OUT_OF_RANGE]: '범위 초과',
            [HIDPP.ERRORS.HW_ERROR]: '하드웨어 오류',
            [HIDPP.ERRORS.LOGITECH_INTERNAL]: '내부 오류',
            [HIDPP.ERRORS.INVALID_FEATURE_INDEX]: '잘못된 기능 인덱스',
            [HIDPP.ERRORS.INVALID_FUNCTION_ID]: '잘못된 함수 ID',
            [HIDPP.ERRORS.BUSY]: '장치 사용 중',
            [HIDPP.ERRORS.UNSUPPORTED]: '지원되지 않음',
        };
        return messages[code] || `알 수 없는 오류 (0x${code.toString(16)})`;
    }

    /**
     * Feature 인덱스 조회
     */
    async getFeatureIndex(featureId) {
        if (this.featureCache.has(featureId)) {
            return this.featureCache.get(featureId);
        }

        // ROOT feature (0x0000)의 function 0으로 feature index 조회
        const data = [
            (featureId >> 8) & 0xff,
            featureId & 0xff,
        ];

        const response = await this.callFeatureByIndex(0x00, 0, data);
        const index = response[0];

        if (index === 0 && featureId !== HIDPP.FEATURES.ROOT) {
            throw new Error(`Feature 0x${featureId.toString(16)} not supported`);
        }

        this.featureCache.set(featureId, index);
        return index;
    }

    /**
     * Feature 지원 여부 확인
     */
    async hasFeature(featureId) {
        try {
            const index = await this.getFeatureIndex(featureId);
            return index !== 0 || featureId === HIDPP.FEATURES.ROOT;
        } catch (e) {
            return false;
        }
    }

    /**
     * Feature 호출 (Feature ID로)
     */
    async callFeature(featureId, functionId, params = []) {
        const featureIndex = await this.getFeatureIndex(featureId);
        return this.callFeatureByIndex(featureIndex, functionId, params);
    }

    /**
     * Feature 호출 (인덱스로)
     */
    async callFeatureByIndex(featureIndex, functionId, params = []) {
        const swId = (this.requestId++ & 0x0f) | 0x01; // SW ID 0은 사용하지 않음
        const funcIdSwId = (functionId << 4) | swId;

        // 리포트 크기 결정
        const paramLength = params.length;
        let reportId;
        if (paramLength <= 3) {
            reportId = HIDPP.REPORT_SHORT;
        } else if (paramLength <= 16) {
            reportId = HIDPP.REPORT_LONG;
        } else {
            reportId = HIDPP.REPORT_VERY_LONG;
        }

        const data = [
            this.deviceIndex,
            featureIndex,
            funcIdSwId,
            ...params,
        ];

        // Promise 생성 및 대기 등록
        const requestKey = `${this.deviceIndex}-${featureIndex}-${swId}`;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestKey);
                reject(new Error('요청 시간 초과'));
            }, 5000);

            this.pendingRequests.set(requestKey, {
                resolve: (result) => {
                    clearTimeout(timeout);
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });

            this.sendReport(reportId, data).catch(reject);
        });
    }

    /**
     * 장치 정보 조회
     */
    async getDeviceInfo() {
        const info = {
            name: this.device.productName,
            pid: this.device.productId,
            vid: this.device.vendorId,
            protocol: 'HID++ 2.0',
            features: [],
        };

        // 지원되는 모델 정보
        const modelInfo = SUPPORTED_DEVICES[info.pid];
        if (modelInfo) {
            info.modelName = modelInfo.name;
            info.buttons = modelInfo.buttons;
            info.maxDpi = modelInfo.maxDpi;
        }

        // 장치 이름 조회 시도
        try {
            if (await this.hasFeature(HIDPP.FEATURES.DEVICE_NAME)) {
                const nameResponse = await this.callFeature(HIDPP.FEATURES.DEVICE_NAME, 0, []);
                const nameLength = nameResponse[0];

                let deviceName = '';
                let offset = 0;
                while (offset < nameLength) {
                    const chunk = await this.callFeature(HIDPP.FEATURES.DEVICE_NAME, 1, [offset]);
                    for (let i = 0; i < chunk.length && offset < nameLength; i++, offset++) {
                        if (chunk[i] !== 0) {
                            deviceName += String.fromCharCode(chunk[i]);
                        }
                    }
                }
                info.deviceName = deviceName.trim();
            }
        } catch (e) {
            console.warn('장치 이름 조회 실패:', e);
        }

        // 지원되는 기능 목록 조회
        try {
            for (const [name, featureId] of Object.entries(HIDPP.FEATURES)) {
                if (await this.hasFeature(featureId)) {
                    info.features.push(name);
                }
            }
        } catch (e) {
            console.warn('기능 목록 조회 실패:', e);
        }

        return info;
    }

    /**
     * DPI 설정 조회
     */
    async getDpiSettings() {
        if (!await this.hasFeature(HIDPP.FEATURES.ADJUSTABLE_DPI)) {
            throw new Error('DPI 조정 기능을 지원하지 않는 장치입니다.');
        }

        // 센서 정보 조회
        const sensorInfo = await this.callFeature(HIDPP.FEATURES.ADJUSTABLE_DPI, 0, [0]);
        const sensorCount = sensorInfo[0] || 1;

        // 현재 DPI 조회
        const dpiResponse = await this.callFeature(HIDPP.FEATURES.ADJUSTABLE_DPI, 1, [0]);
        const currentDpi = (dpiResponse[0] << 8) | dpiResponse[1];
        const defaultDpi = (dpiResponse[2] << 8) | dpiResponse[3];

        return {
            sensorCount,
            currentDpi,
            defaultDpi,
            minDpi: 100,
            maxDpi: SUPPORTED_DEVICES[this.device.productId]?.maxDpi || 25600,
        };
    }

    /**
     * DPI 설정
     */
    async setDpi(dpi, sensorIndex = 0) {
        if (!await this.hasFeature(HIDPP.FEATURES.ADJUSTABLE_DPI)) {
            throw new Error('DPI 조정 기능을 지원하지 않는 장치입니다.');
        }

        const params = [
            sensorIndex,
            (dpi >> 8) & 0xff,
            dpi & 0xff,
        ];

        await this.callFeature(HIDPP.FEATURES.ADJUSTABLE_DPI, 2, params);
    }

    /**
     * 폴링 레이트 조회
     */
    async getReportRate() {
        if (!await this.hasFeature(HIDPP.FEATURES.REPORT_RATE)) {
            return null;
        }

        const response = await this.callFeature(HIDPP.FEATURES.REPORT_RATE, 0, []);
        const rateCode = response[0];

        for (const [rate, code] of Object.entries(POLLING_RATES)) {
            if (code === rateCode) {
                return parseInt(rate);
            }
        }
        return null;
    }

    /**
     * 폴링 레이트 설정
     */
    async setReportRate(rate) {
        if (!await this.hasFeature(HIDPP.FEATURES.REPORT_RATE)) {
            throw new Error('폴링 레이트 조정을 지원하지 않는 장치입니다.');
        }

        const rateCode = POLLING_RATES[rate];
        if (!rateCode) {
            throw new Error('지원되지 않는 폴링 레이트입니다.');
        }

        await this.callFeature(HIDPP.FEATURES.REPORT_RATE, 1, [rateCode]);
    }

    /**
     * 온보드 프로필 정보 조회
     */
    async getOnboardProfileInfo() {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            throw new Error('온보드 프로필을 지원하지 않는 장치입니다.');
        }

        const info = await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 0, []);

        return {
            memoryModel: info[0],
            profileFormat: info[1],
            macroFormat: info[2],
            profileCount: info[3],
            profileCountOOB: info[4],
            buttonCount: info[5],
            sectorCount: info[6],
            sectorSize: (info[7] << 8) | info[8],
            mechanicalLayout: info[9],
            variousInfo: info[10],
            hasGShift: !!(info[10] & 0x01),
            hasDpiShift: !!(info[10] & 0x02),
        };
    }

    /**
     * 온보드 모드 상태 조회
     */
    async getOnboardMode() {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            return null;
        }

        const response = await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 2, []);
        return response[0] === 0x01;
    }

    /**
     * 온보드 모드 설정
     */
    async setOnboardMode(enabled) {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            throw new Error('온보드 프로필을 지원하지 않는 장치입니다.');
        }

        await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 1, [enabled ? 0x01 : 0x02]);
    }

    /**
     * 현재 프로필 조회
     */
    async getCurrentProfile() {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            return null;
        }

        const response = await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 4, []);
        return response[0];
    }

    /**
     * 프로필 전환
     */
    async switchProfile(profileIndex) {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            throw new Error('온보드 프로필을 지원하지 않는 장치입니다.');
        }

        await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 3, [profileIndex]);
    }

    /**
     * 메모리 페이지 읽기
     */
    async readMemoryPage(pageNumber) {
        if (!await this.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
            throw new Error('온보드 프로필을 지원하지 않는 장치입니다.');
        }

        const pageData = [];
        const pageSize = 256; // 기본 페이지 크기

        for (let offset = 0; offset < pageSize; offset += 16) {
            const params = [
                (pageNumber >> 8) & 0xff,
                pageNumber & 0xff,
                (offset >> 8) & 0xff,
                offset & 0xff,
            ];

            const response = await this.callFeature(HIDPP.FEATURES.ONBOARD_PROFILES, 5, params);
            pageData.push(...response.slice(0, 16));
        }

        return new Uint8Array(pageData);
    }

    /**
     * RGB LED 설정
     */
    async setRgbEffect(effect, color, brightness, speed) {
        // RGB_EFFECTS feature 사용 시도
        if (await this.hasFeature(HIDPP.FEATURES.RGB_EFFECTS)) {
            let modeCode;
            switch (effect) {
                case 'off':
                    modeCode = RGB_MODES.OFF;
                    break;
                case 'static':
                    modeCode = RGB_MODES.STATIC;
                    break;
                case 'breathing':
                    modeCode = RGB_MODES.BREATHING;
                    break;
                case 'cycle':
                    modeCode = RGB_MODES.CYCLE;
                    break;
                default:
                    modeCode = RGB_MODES.STATIC;
            }

            // 색상 파싱
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            const params = [
                0x00, // zone index
                modeCode,
                r, g, b,
                Math.round(brightness * 2.55), // 0-255
                (speed >> 8) & 0xff,
                speed & 0xff,
            ];

            await this.callFeature(HIDPP.FEATURES.RGB_EFFECTS, 1, params);
            return;
        }

        // BACKLIGHT feature 사용 시도
        if (await this.hasFeature(HIDPP.FEATURES.BACKLIGHT)) {
            console.warn('BACKLIGHT feature를 통한 RGB 제어는 제한적입니다.');
            return;
        }

        throw new Error('RGB 조명 기능을 지원하지 않는 장치입니다.');
    }

    /**
     * 배터리 상태 조회 (무선 마우스)
     */
    async getBatteryStatus() {
        if (await this.hasFeature(HIDPP.FEATURES.BATTERY_STATUS)) {
            const response = await this.callFeature(HIDPP.FEATURES.BATTERY_STATUS, 0, []);
            return {
                level: response[0],
                status: response[1],
                isCharging: response[1] === 0x01,
            };
        }

        if (await this.hasFeature(HIDPP.FEATURES.BATTERY_VOLTAGE)) {
            const response = await this.callFeature(HIDPP.FEATURES.BATTERY_VOLTAGE, 0, []);
            const voltage = (response[0] << 8) | response[1];
            // 대략적인 배터리 레벨 계산 (3.5V = 0%, 4.2V = 100%)
            const level = Math.min(100, Math.max(0, ((voltage - 3500) / 700) * 100));
            return {
                voltage,
                level: Math.round(level),
                status: response[2],
            };
        }

        return null;
    }
}

// 전역 인스턴스
const hidppDevice = new HidppDevice();

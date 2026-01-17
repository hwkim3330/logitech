/**
 * Logitech OMM - Main Application
 * 메인 애플리케이션 로직
 */

class App {
    constructor() {
        this.connected = false;
        this.deviceInfo = null;
        this.selectedButton = null;
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('Logitech OMM v1.0.0 초기화');

        // UI 초기화
        ui.init();

        // 프로필 초기화
        profileManager.initProfiles(3);

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 초기 UI 상태 설정
        this.updateUI();

        // WebHID 지원 확인
        if (!navigator.hid) {
            ui.error('WebHID API가 지원되지 않습니다. Chrome 89+ 또는 Edge 89+를 사용하세요.');
        }

        // 저장된 프로필 로드 시도
        this.loadSavedProfiles();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 연결 버튼
        document.getElementById('connectBtn').addEventListener('click', () => {
            if (this.connected) {
                this.disconnect();
            } else {
                this.connect();
            }
        });

        // 탭 전환
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // 프로필 선택
        document.getElementById('profileList').addEventListener('click', (e) => {
            const item = e.target.closest('.profile-item');
            if (item) {
                this.selectProfile(parseInt(item.dataset.profile));
            }
        });

        // DPI 설정
        this.setupDpiListeners();

        // 버튼 매핑
        this.setupButtonListeners();

        // RGB 설정
        this.setupRgbListeners();

        // 고급 설정
        this.setupAdvancedListeners();

        // 액션 버튼
        document.getElementById('applyBtn').addEventListener('click', () => this.applySettings());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetProfile());

        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportProfile());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importProfile(e));
    }

    /**
     * DPI 이벤트 리스너 설정
     */
    setupDpiListeners() {
        document.querySelectorAll('.dpi-stage').forEach((stage, index) => {
            // 체크박스
            stage.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                profileManager.updateDpiStage(index, { enabled: e.target.checked });
            });

            // DPI 입력
            const inputs = stage.querySelectorAll('.dpi-input');
            inputs[0].addEventListener('change', (e) => {
                const value = profileManager.clampDpi(parseInt(e.target.value) || 800);
                e.target.value = value;
                profileManager.updateDpiStage(index, { x: value });
                stage.querySelector('.dpi-slider').value = value;
            });
            inputs[1].addEventListener('change', (e) => {
                const value = profileManager.clampDpi(parseInt(e.target.value) || 800);
                e.target.value = value;
                profileManager.updateDpiStage(index, { y: value });
            });

            // 슬라이더
            stage.querySelector('.dpi-slider').addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                inputs[0].value = value;
                inputs[1].value = value;
                profileManager.updateDpiStage(index, { x: value, y: value });
            });
        });

        // 기본 DPI 단계
        document.getElementById('defaultDpiStage').addEventListener('change', (e) => {
            const stage = parseInt(e.target.value) - 1;
            profileManager.updateCurrentProfile({ defaultDpiStage: stage });

            // 활성 단계 표시 업데이트
            document.querySelectorAll('.dpi-stage').forEach((s, i) => {
                s.classList.toggle('active', i === stage);
            });
        });
    }

    /**
     * 버튼 매핑 이벤트 리스너 설정
     */
    setupButtonListeners() {
        // 마우스 시각화 버튼
        document.querySelectorAll('.mouse-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const button = btn.dataset.button;
                this.selectButton(button);
            });
        });

        // 버튼 목록 아이템
        document.querySelectorAll('.button-item').forEach(item => {
            item.addEventListener('click', () => {
                const button = item.dataset.button;
                this.selectButton(button);
            });

            // 액션 선택
            item.querySelector('.button-action').addEventListener('change', (e) => {
                const button = item.dataset.button;
                const value = e.target.value;

                if (value === 'key') {
                    this.showKeyConfig(button);
                } else if (value === 'macro') {
                    ui.info('매크로 편집기는 곧 출시됩니다.');
                } else {
                    profileManager.updateButtonMapping(button, { action: 'button', value });
                }
            });
        });

        // 키 설정 저장
        document.getElementById('saveKeyConfig').addEventListener('click', () => {
            this.saveKeyConfig();
        });

        // 키 입력 감지
        document.getElementById('keyInput').addEventListener('keydown', (e) => {
            e.preventDefault();
            document.getElementById('keyInput').value = e.key;
            document.getElementById('keyInput').dataset.code = e.code;
        });
    }

    /**
     * RGB 이벤트 리스너 설정
     */
    setupRgbListeners() {
        // 현재 선택된 LED 영역 (logo, dpi, both)
        this.selectedLedZone = 'logo';

        // LED 영역 선택 버튼
        document.querySelectorAll('.zone-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedLedZone = btn.dataset.zone;

                // 선택된 영역의 현재 설정을 UI에 반영
                const profile = profileManager.getCurrentProfile();
                const zone = this.selectedLedZone === 'both' ? 'logo' : this.selectedLedZone;
                const rgbSettings = profile.rgb[zone] || profile.rgb.logo;

                document.getElementById('rgbEffect').value = rgbSettings.effect;
                document.getElementById('rgbColor').value = rgbSettings.color;
                document.getElementById('rgbColorHex').value = rgbSettings.color;
                document.getElementById('rgbBrightness').value = rgbSettings.brightness;
                document.getElementById('brightnessValue').textContent = rgbSettings.brightness;
                document.getElementById('rgbSpeed').value = rgbSettings.speed;
                document.getElementById('speedValue').textContent = rgbSettings.speed;

                ui.updateRgbControls(rgbSettings.effect);

                // LED 프리뷰에서 선택 표시
                document.getElementById('ledZone1').classList.toggle('selected', this.selectedLedZone === 'logo' || this.selectedLedZone === 'both');
                document.getElementById('ledZone2').classList.toggle('selected', this.selectedLedZone === 'dpi' || this.selectedLedZone === 'both');
            });
        });

        // LED 영역 클릭으로도 선택 가능
        document.getElementById('ledZone1').addEventListener('click', () => {
            document.getElementById('zoneLogo').click();
        });
        document.getElementById('ledZone2').addEventListener('click', () => {
            document.getElementById('zoneDpi').click();
        });

        // 효과 선택
        document.getElementById('rgbEffect').addEventListener('change', (e) => {
            this.updateZoneRgbSettings({ effect: e.target.value });
            ui.updateRgbControls(e.target.value);
        });

        // 색상 선택
        document.getElementById('rgbColor').addEventListener('input', (e) => {
            document.getElementById('rgbColorHex').value = e.target.value;
            this.updateZoneRgbSettings({ color: e.target.value });
        });

        document.getElementById('rgbColorHex').addEventListener('change', (e) => {
            let color = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                document.getElementById('rgbColor').value = color;
                this.updateZoneRgbSettings({ color });
            }
        });

        // 밝기
        document.getElementById('rgbBrightness').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('brightnessValue').textContent = value;
            this.updateZoneRgbSettings({ brightness: value });
        });

        // 속도
        document.getElementById('rgbSpeed').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = value;
            this.updateZoneRgbSettings({ speed: value });
        });

        // 프리셋 색상
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                document.getElementById('rgbColor').value = color;
                document.getElementById('rgbColorHex').value = color;
                this.updateZoneRgbSettings({ color });
            });
        });
    }

    /**
     * 선택된 LED 영역의 RGB 설정 업데이트
     */
    updateZoneRgbSettings(settings) {
        const profile = profileManager.getCurrentProfile();

        if (this.selectedLedZone === 'both') {
            // 두 영역 모두 업데이트
            profile.rgb.logo = { ...profile.rgb.logo, ...settings };
            profile.rgb.dpi = { ...profile.rgb.dpi, ...settings };
            profile.rgb.syncZones = true;
        } else {
            // 선택된 영역만 업데이트
            profile.rgb[this.selectedLedZone] = { ...profile.rgb[this.selectedLedZone], ...settings };
            profile.rgb.syncZones = false;
        }

        ui.updateRgbPreview(profile.rgb);
    }

    /**
     * 고급 설정 이벤트 리스너 설정
     */
    setupAdvancedListeners() {
        // 폴링 레이트
        document.querySelectorAll('input[name="polling"]').forEach(input => {
            input.addEventListener('change', (e) => {
                profileManager.updateCurrentProfile({ pollingRate: parseInt(e.target.value) });
            });
        });

        // 온보드 모드
        document.getElementById('onboardMode').addEventListener('change', async (e) => {
            if (this.connected) {
                try {
                    await hidppDevice.setOnboardMode(e.target.checked);
                    ui.success(`온보드 모드 ${e.target.checked ? '활성화' : '비활성화'}됨`);
                } catch (err) {
                    ui.error('온보드 모드 설정 실패: ' + err.message);
                    e.target.checked = !e.target.checked;
                }
            }
        });

        // 앵글 스내핑
        document.getElementById('angleSnapping').addEventListener('change', (e) => {
            profileManager.updateCurrentProfile({ angleSnapping: e.target.checked });
        });

        // LOD
        document.getElementById('lodSetting').addEventListener('change', (e) => {
            profileManager.updateCurrentProfile({ lod: e.target.value });
        });
    }

    /**
     * 장치 연결
     */
    async connect() {
        const btn = document.getElementById('connectBtn');
        ui.showLoading(btn);

        try {
            this.deviceInfo = await hidppDevice.connect();
            this.connected = true;

            // UI 업데이트
            ui.updateConnectionStatus(true, this.deviceInfo.deviceName || this.deviceInfo.name);
            ui.updateDeviceInfo(this.deviceInfo);
            ui.setButtonsEnabled(true);

            // 프로필 매니저에 장치 정보 설정
            profileManager.deviceInfo = this.deviceInfo;

            // 장치에서 프로필 읽기 시도
            await this.readDeviceProfiles();

            ui.success('마우스가 연결되었습니다!');
        } catch (error) {
            console.error('연결 실패:', error);
            ui.error('연결 실패: ' + error.message);
        } finally {
            ui.showLoading(btn, false);
        }
    }

    /**
     * 장치 연결 해제
     */
    async disconnect() {
        try {
            await hidppDevice.disconnect();
            this.connected = false;
            this.deviceInfo = null;

            ui.updateConnectionStatus(false);
            ui.clearDeviceInfo();
            ui.setButtonsEnabled(false);

            ui.info('연결이 해제되었습니다.');
        } catch (error) {
            console.error('연결 해제 실패:', error);
            ui.error('연결 해제 실패: ' + error.message);
        }
    }

    /**
     * 장치에서 프로필 읽기
     */
    async readDeviceProfiles() {
        try {
            // 온보드 프로필 지원 확인
            if (await hidppDevice.hasFeature(HIDPP.FEATURES.ONBOARD_PROFILES)) {
                const info = await hidppDevice.getOnboardProfileInfo();
                this.deviceInfo.profileCount = info.profileCount;
                this.deviceInfo.buttonCount = info.buttonCount;

                // 프로필 개수에 맞게 초기화
                profileManager.initProfiles(info.profileCount);

                // 현재 프로필 읽기
                const currentProfile = await hidppDevice.getCurrentProfile();
                if (currentProfile !== null) {
                    profileManager.selectProfile(currentProfile);
                }

                ui.updateDeviceInfo(this.deviceInfo);
            }

            // DPI 설정 읽기
            if (await hidppDevice.hasFeature(HIDPP.FEATURES.ADJUSTABLE_DPI)) {
                const dpiInfo = await hidppDevice.getDpiSettings();
                const profile = profileManager.getCurrentProfile();

                // 현재 DPI를 첫 번째 활성 단계에 설정
                if (dpiInfo.currentDpi) {
                    const activeStage = profile.dpiStages.findIndex(s => s.enabled);
                    if (activeStage >= 0) {
                        profileManager.updateDpiStage(activeStage, {
                            x: dpiInfo.currentDpi,
                            y: dpiInfo.currentDpi
                        });
                    }
                }
            }

            // 폴링 레이트 읽기
            if (await hidppDevice.hasFeature(HIDPP.FEATURES.REPORT_RATE)) {
                const rate = await hidppDevice.getReportRate();
                if (rate) {
                    profileManager.updateCurrentProfile({ pollingRate: rate });
                }
            }

            // UI 업데이트
            this.updateUI();

        } catch (error) {
            console.warn('프로필 읽기 실패:', error);
        }
    }

    /**
     * 설정 적용
     */
    async applySettings() {
        if (!this.connected) {
            ui.warning('먼저 마우스를 연결하세요.');
            return;
        }

        const btn = document.getElementById('applyBtn');
        ui.showLoading(btn);

        try {
            const profile = profileManager.getCurrentProfile();

            // DPI 설정 적용
            if (await hidppDevice.hasFeature(HIDPP.FEATURES.ADJUSTABLE_DPI)) {
                const activeStage = profile.dpiStages[profile.defaultDpiStage];
                if (activeStage && activeStage.enabled) {
                    await hidppDevice.setDpi(activeStage.x);
                }
            }

            // 폴링 레이트 적용
            if (await hidppDevice.hasFeature(HIDPP.FEATURES.REPORT_RATE)) {
                await hidppDevice.setReportRate(profile.pollingRate);
            }

            // RGB 설정 적용
            try {
                await hidppDevice.setRgbEffect(
                    profile.rgb.effect,
                    profile.rgb.color,
                    profile.rgb.brightness,
                    profile.rgb.speed
                );
            } catch (e) {
                console.warn('RGB 설정 실패:', e);
            }

            // 로컬 스토리지에 프로필 저장
            this.saveProfiles();

            ui.success('설정이 적용되었습니다!');
        } catch (error) {
            console.error('설정 적용 실패:', error);
            ui.error('설정 적용 실패: ' + error.message);
        } finally {
            ui.showLoading(btn, false);
        }
    }

    /**
     * 프로필 초기화
     */
    async resetProfile() {
        const confirmed = await ui.confirm(
            '프로필 초기화',
            '현재 프로필을 기본값으로 초기화하시겠습니까?'
        );

        if (confirmed) {
            const index = profileManager.currentProfileIndex;
            const defaultProfile = profileManager.createDefaultProfile(index);
            profileManager.profiles[index] = defaultProfile;
            this.updateUI();
            ui.success('프로필이 초기화되었습니다.');
        }
    }

    /**
     * 탭 전환
     */
    switchTab(tabId) {
        // 탭 버튼 활성화
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // 탭 패널 표시
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    /**
     * 프로필 선택
     */
    selectProfile(index) {
        profileManager.selectProfile(index);

        // 프로필 목록 UI 업데이트
        document.querySelectorAll('.profile-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // 설정 UI 업데이트
        this.updateUI();

        // 연결된 경우 장치의 프로필도 전환
        if (this.connected) {
            hidppDevice.switchProfile(index).catch(err => {
                console.warn('프로필 전환 실패:', err);
            });
        }
    }

    /**
     * 버튼 선택
     */
    selectButton(button) {
        this.selectedButton = button;

        // 시각화 업데이트
        document.querySelectorAll('.mouse-button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.button === button);
        });

        // 목록 업데이트
        document.querySelectorAll('.button-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.button === button);
        });
    }

    /**
     * 키 설정 표시
     */
    showKeyConfig(button) {
        this.selectedButton = button;
        const keyConfig = document.getElementById('keyConfig');
        keyConfig.classList.remove('hidden');

        // 현재 설정 로드
        const profile = profileManager.getCurrentProfile();
        const mapping = profile.buttons[button];

        if (mapping && mapping.action === 'key') {
            document.getElementById('keyInput').value = mapping.key || '';
            document.getElementById('modCtrl').checked = mapping.modifiers?.includes('ctrl');
            document.getElementById('modShift').checked = mapping.modifiers?.includes('shift');
            document.getElementById('modAlt').checked = mapping.modifiers?.includes('alt');
            document.getElementById('modWin').checked = mapping.modifiers?.includes('win');
        } else {
            document.getElementById('keyInput').value = '';
            document.getElementById('modCtrl').checked = false;
            document.getElementById('modShift').checked = false;
            document.getElementById('modAlt').checked = false;
            document.getElementById('modWin').checked = false;
        }
    }

    /**
     * 키 설정 저장
     */
    saveKeyConfig() {
        if (!this.selectedButton) return;

        const key = document.getElementById('keyInput').value;
        const modifiers = [];

        if (document.getElementById('modCtrl').checked) modifiers.push('ctrl');
        if (document.getElementById('modShift').checked) modifiers.push('shift');
        if (document.getElementById('modAlt').checked) modifiers.push('alt');
        if (document.getElementById('modWin').checked) modifiers.push('win');

        profileManager.updateButtonMapping(this.selectedButton, {
            action: 'key',
            key,
            modifiers
        });

        document.getElementById('keyConfig').classList.add('hidden');
        ui.success('키 설정이 저장되었습니다.');
    }

    /**
     * 프로필 내보내기
     */
    exportProfile() {
        const data = profileManager.exportAllProfiles();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `logitech-omm-profiles-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);
        ui.success('프로필이 내보내졌습니다.');
    }

    /**
     * 프로필 가져오기
     */
    importProfile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                profileManager.importProfile(e.target.result);
                this.updateUI();
                ui.success('프로필을 가져왔습니다.');
            } catch (error) {
                ui.error('프로필 가져오기 실패: ' + error.message);
            }
        };
        reader.readAsText(file);

        // 입력 초기화 (같은 파일 재선택 허용)
        event.target.value = '';
    }

    /**
     * 프로필 로컬 저장
     */
    saveProfiles() {
        try {
            const data = profileManager.exportAllProfiles();
            localStorage.setItem('logitech-omm-profiles', JSON.stringify(data));
        } catch (e) {
            console.warn('프로필 저장 실패:', e);
        }
    }

    /**
     * 저장된 프로필 로드
     */
    loadSavedProfiles() {
        try {
            const saved = localStorage.getItem('logitech-omm-profiles');
            if (saved) {
                profileManager.importProfile(saved);
                console.log('저장된 프로필 로드됨');
            }
        } catch (e) {
            console.warn('프로필 로드 실패:', e);
        }
    }

    /**
     * UI 전체 업데이트
     */
    updateUI() {
        const profile = profileManager.getCurrentProfile();
        ui.updateProfileList(profileManager.profiles, profileManager.currentProfileIndex);
        ui.updateAllUI(profile);
    }
}

// 앱 시작
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

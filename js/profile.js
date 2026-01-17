/**
 * Logitech OMM - Profile Manager
 * 프로필 데이터 관리 및 직렬화
 */

class ProfileManager {
    constructor() {
        this.profiles = [];
        this.currentProfileIndex = 0;
        this.deviceInfo = null;
    }

    /**
     * 기본 프로필 생성 (G502 11개 버튼 + 2 LED 영역)
     */
    createDefaultProfile(index) {
        return {
            index,
            name: `Profile ${index + 1}`,
            enabled: true,
            visible: true,
            dpiStages: [
                { enabled: true, x: 800, y: 800, color: DPI_COLORS[0] },
                { enabled: true, x: 1600, y: 1600, color: DPI_COLORS[1] },
                { enabled: true, x: 3200, y: 3200, color: DPI_COLORS[2] },
                { enabled: false, x: 6400, y: 6400, color: DPI_COLORS[3] },
                { enabled: false, x: 12800, y: 12800, color: DPI_COLORS[4] },
            ],
            dpiShift: 400, // DPI 시프트 (스나이퍼 버튼) 값
            defaultDpiStage: 1,
            pollingRate: 1000,
            angleSnapping: false,
            lod: 'medium',
            // 두 LED 영역 (로고, DPI 표시등)
            rgb: {
                logo: {
                    effect: 'static',
                    color: '#00d4aa',
                    brightness: 100,
                    speed: 1000,
                },
                dpi: {
                    effect: 'static',
                    color: '#00d4aa',
                    brightness: 100,
                    speed: 1000,
                },
                syncZones: true, // 두 영역 동기화 여부
            },
            // G502 11개 버튼
            buttons: {
                left: { action: 'button', value: 'click' },
                right: { action: 'button', value: 'context' },
                middle: { action: 'button', value: 'middle_click' },
                wheel_left: { action: 'button', value: 'scroll_left' },
                wheel_right: { action: 'button', value: 'scroll_right' },
                back: { action: 'button', value: 'back' },         // G4
                forward: { action: 'button', value: 'forward' },   // G5
                dpi_up: { action: 'button', value: 'dpi_up' },     // G7
                dpi_down: { action: 'button', value: 'dpi_down' }, // G8
                dpi_shift: { action: 'button', value: 'dpi_shift' }, // G9 스나이퍼
                g6: { action: 'button', value: 'gshift' },         // G6 프로필/G-Shift
            },
            macros: [],
        };
    }

    /**
     * 프로필 초기화
     */
    initProfiles(count = 3) {
        this.profiles = [];
        for (let i = 0; i < count; i++) {
            this.profiles.push(this.createDefaultProfile(i));
        }
        this.currentProfileIndex = 0;
    }

    /**
     * 현재 프로필 반환
     */
    getCurrentProfile() {
        return this.profiles[this.currentProfileIndex];
    }

    /**
     * 프로필 선택
     */
    selectProfile(index) {
        if (index >= 0 && index < this.profiles.length) {
            this.currentProfileIndex = index;
            return this.getCurrentProfile();
        }
        throw new Error('Invalid profile index');
    }

    /**
     * 프로필 업데이트
     */
    updateProfile(index, data) {
        if (index >= 0 && index < this.profiles.length) {
            this.profiles[index] = { ...this.profiles[index], ...data };
            return this.profiles[index];
        }
        throw new Error('Invalid profile index');
    }

    /**
     * 현재 프로필 업데이트
     */
    updateCurrentProfile(data) {
        return this.updateProfile(this.currentProfileIndex, data);
    }

    /**
     * DPI 설정 업데이트
     */
    updateDpiStage(stageIndex, data) {
        const profile = this.getCurrentProfile();
        if (stageIndex >= 0 && stageIndex < profile.dpiStages.length) {
            profile.dpiStages[stageIndex] = { ...profile.dpiStages[stageIndex], ...data };
            return profile.dpiStages[stageIndex];
        }
        throw new Error('Invalid DPI stage index');
    }

    /**
     * 버튼 매핑 업데이트
     */
    updateButtonMapping(button, mapping) {
        const profile = this.getCurrentProfile();
        profile.buttons[button] = mapping;
        return profile.buttons[button];
    }

    /**
     * RGB 설정 업데이트
     */
    updateRgbSettings(settings) {
        const profile = this.getCurrentProfile();
        profile.rgb = { ...profile.rgb, ...settings };
        return profile.rgb;
    }

    /**
     * 프로필을 JSON으로 내보내기
     */
    exportProfile(index = null) {
        const profile = index !== null ? this.profiles[index] : this.getCurrentProfile();

        return {
            version: '1.0',
            exported: new Date().toISOString(),
            device: this.deviceInfo ? {
                name: this.deviceInfo.name,
                pid: this.deviceInfo.pid,
            } : null,
            profile: JSON.parse(JSON.stringify(profile)), // Deep clone
        };
    }

    /**
     * 모든 프로필을 JSON으로 내보내기
     */
    exportAllProfiles() {
        return {
            version: '1.0',
            exported: new Date().toISOString(),
            device: this.deviceInfo ? {
                name: this.deviceInfo.name,
                pid: this.deviceInfo.pid,
            } : null,
            profiles: JSON.parse(JSON.stringify(this.profiles)),
        };
    }

    /**
     * JSON에서 프로필 가져오기
     */
    importProfile(json, targetIndex = null) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;

            // 단일 프로필 가져오기
            if (data.profile) {
                const index = targetIndex !== null ? targetIndex : this.currentProfileIndex;
                const imported = this.validateAndNormalizeProfile(data.profile);
                imported.index = index;
                this.profiles[index] = imported;
                return imported;
            }

            // 다중 프로필 가져오기
            if (data.profiles && Array.isArray(data.profiles)) {
                this.profiles = data.profiles.map((p, i) => {
                    const normalized = this.validateAndNormalizeProfile(p);
                    normalized.index = i;
                    return normalized;
                });
                this.currentProfileIndex = 0;
                return this.profiles;
            }

            throw new Error('Invalid profile data format');

        } catch (error) {
            console.error('Profile import error:', error);
            throw new Error('프로필 가져오기 실패: ' + error.message);
        }
    }

    /**
     * 프로필 유효성 검사 및 정규화
     */
    validateAndNormalizeProfile(data) {
        const profile = this.createDefaultProfile(0);

        // 기본 정보
        if (data.name) profile.name = String(data.name).slice(0, 32);
        if (typeof data.enabled === 'boolean') profile.enabled = data.enabled;
        if (typeof data.visible === 'boolean') profile.visible = data.visible;

        // DPI 설정
        if (data.dpiStages && Array.isArray(data.dpiStages)) {
            profile.dpiStages = data.dpiStages.slice(0, 5).map((stage, i) => ({
                enabled: typeof stage.enabled === 'boolean' ? stage.enabled : true,
                x: this.clampDpi(stage.x || stage.dpi || 800),
                y: this.clampDpi(stage.y || stage.dpi || 800),
                color: stage.color || DPI_COLORS[i] || '#ffffff',
            }));

            // 5개 미만이면 기본값으로 채움
            while (profile.dpiStages.length < 5) {
                const i = profile.dpiStages.length;
                profile.dpiStages.push({
                    enabled: false,
                    x: 800 * Math.pow(2, i),
                    y: 800 * Math.pow(2, i),
                    color: DPI_COLORS[i] || '#ffffff',
                });
            }
        }

        if (typeof data.defaultDpiStage === 'number') {
            profile.defaultDpiStage = Math.min(4, Math.max(0, data.defaultDpiStage));
        }

        // 폴링 레이트
        if (data.pollingRate && POLLING_RATES[data.pollingRate]) {
            profile.pollingRate = data.pollingRate;
        }

        // 기타 설정
        if (typeof data.angleSnapping === 'boolean') {
            profile.angleSnapping = data.angleSnapping;
        }
        if (['low', 'medium', 'high'].includes(data.lod)) {
            profile.lod = data.lod;
        }

        // RGB 설정
        if (data.rgb) {
            if (['off', 'static', 'breathing', 'cycle'].includes(data.rgb.effect)) {
                profile.rgb.effect = data.rgb.effect;
            }
            if (data.rgb.color && /^#[0-9a-fA-F]{6}$/.test(data.rgb.color)) {
                profile.rgb.color = data.rgb.color;
            }
            if (typeof data.rgb.brightness === 'number') {
                profile.rgb.brightness = Math.min(100, Math.max(0, data.rgb.brightness));
            }
            if (typeof data.rgb.speed === 'number') {
                profile.rgb.speed = Math.min(5000, Math.max(100, data.rgb.speed));
            }
        }

        // 버튼 매핑
        if (data.buttons) {
            for (const [button, mapping] of Object.entries(data.buttons)) {
                if (profile.buttons.hasOwnProperty(button)) {
                    profile.buttons[button] = this.validateButtonMapping(mapping);
                }
            }
        }

        // 매크로
        if (data.macros && Array.isArray(data.macros)) {
            profile.macros = data.macros.slice(0, 16).map(m => this.validateMacro(m));
        }

        return profile;
    }

    /**
     * DPI 값 범위 제한
     */
    clampDpi(value) {
        const min = DPI_RANGE.min;
        const max = DPI_RANGE.max;
        const step = DPI_RANGE.step;
        value = Math.min(max, Math.max(min, value));
        return Math.round(value / step) * step;
    }

    /**
     * 버튼 매핑 유효성 검사
     */
    validateButtonMapping(mapping) {
        if (typeof mapping === 'string') {
            // 레거시 형식 지원
            return { action: 'button', value: mapping };
        }

        if (typeof mapping !== 'object') {
            return { action: 'button', value: 'click' };
        }

        const validActions = ['button', 'key', 'macro', 'disabled'];
        if (!validActions.includes(mapping.action)) {
            return { action: 'button', value: 'click' };
        }

        const result = { action: mapping.action };

        switch (mapping.action) {
            case 'button':
                result.value = mapping.value || 'click';
                break;
            case 'key':
                result.key = mapping.key || 'a';
                result.modifiers = mapping.modifiers || [];
                break;
            case 'macro':
                result.macroIndex = typeof mapping.macroIndex === 'number' ? mapping.macroIndex : 0;
                break;
            case 'disabled':
                break;
        }

        return result;
    }

    /**
     * 매크로 유효성 검사
     */
    validateMacro(macro) {
        if (!macro || typeof macro !== 'object') {
            return { name: 'Macro', actions: [] };
        }

        return {
            name: String(macro.name || 'Macro').slice(0, 32),
            repeat: typeof macro.repeat === 'number' ? Math.min(255, Math.max(0, macro.repeat)) : 0,
            actions: (macro.actions || []).slice(0, 256).map(action => {
                if (!action || typeof action !== 'object') {
                    return { type: 'delay', value: 10 };
                }

                const validTypes = ['keydown', 'keyup', 'delay', 'mousedown', 'mouseup', 'wheel', 'move'];
                if (!validTypes.includes(action.type)) {
                    return { type: 'delay', value: 10 };
                }

                return {
                    type: action.type,
                    value: action.value,
                    modifiers: action.modifiers,
                };
            }),
        };
    }

    /**
     * 프로필을 바이너리로 변환 (온보드 메모리용)
     */
    profileToBinary(profile) {
        // G502 프로필 형식 기반
        const buffer = new ArrayBuffer(256);
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);

        let offset = 0;

        // 헤더 (report rate, default dpi)
        view.setUint8(offset++, POLLING_RATES[profile.pollingRate] || 0x01);
        view.setUint8(offset++, profile.defaultDpiStage);

        // G-Shift DPI (사용 안 함 = 0)
        view.setUint16(offset, 0, false);
        offset += 2;

        // DPI 단계 (5개, 각 4바이트: enabled, X DPI high, X DPI low, reserved)
        for (let i = 0; i < 5; i++) {
            const stage = profile.dpiStages[i];
            view.setUint8(offset++, stage.enabled ? 0x01 : 0x00);
            view.setUint16(offset, stage.x, false);
            offset += 2;
            view.setUint8(offset++, 0x00); // Y DPI는 별도 저장 또는 X와 동일
        }

        // RGB 설정 (8바이트)
        const rgbOffset = 32;
        let rgbMode;
        switch (profile.rgb.effect) {
            case 'off': rgbMode = RGB_MODES.OFF; break;
            case 'static': rgbMode = RGB_MODES.STATIC; break;
            case 'breathing': rgbMode = RGB_MODES.BREATHING; break;
            case 'cycle': rgbMode = RGB_MODES.CYCLE; break;
            default: rgbMode = RGB_MODES.STATIC;
        }

        view.setUint8(rgbOffset, rgbMode);
        view.setUint8(rgbOffset + 1, parseInt(profile.rgb.color.slice(1, 3), 16)); // R
        view.setUint8(rgbOffset + 2, parseInt(profile.rgb.color.slice(3, 5), 16)); // G
        view.setUint8(rgbOffset + 3, parseInt(profile.rgb.color.slice(5, 7), 16)); // B
        view.setUint8(rgbOffset + 4, Math.round(profile.rgb.brightness * 2.55));
        view.setUint16(rgbOffset + 5, profile.rgb.speed, false);

        // 버튼 매핑 (각 버튼 4바이트)
        const buttonOffset = 64;
        const buttonOrder = ['left', 'right', 'middle', 'back', 'forward', 'dpi', 'gshift'];

        for (let i = 0; i < buttonOrder.length; i++) {
            const btnOffset = buttonOffset + (i * 4);
            const mapping = profile.buttons[buttonOrder[i]];

            if (mapping.action === 'button') {
                const code = SPECIAL_FUNCTIONS[mapping.value] || MOUSE_BUTTONS.LEFT_CLICK;
                view.setUint8(btnOffset, 0x80); // Button type
                view.setUint8(btnOffset + 1, code);
                view.setUint16(btnOffset + 2, 0);
            } else if (mapping.action === 'key') {
                const keyCode = KEY_CODES[mapping.key.toLowerCase()] || 0x04;
                let modifiers = 0;
                if (mapping.modifiers) {
                    for (const mod of mapping.modifiers) {
                        modifiers |= MODIFIER_CODES[mod] || 0;
                    }
                }
                view.setUint8(btnOffset, 0x90); // Key type
                view.setUint8(btnOffset + 1, modifiers);
                view.setUint8(btnOffset + 2, keyCode);
                view.setUint8(btnOffset + 3, 0);
            } else if (mapping.action === 'macro') {
                view.setUint8(btnOffset, 0xa0); // Macro type
                view.setUint8(btnOffset + 1, mapping.macroIndex || 0);
                view.setUint16(btnOffset + 2, 0);
            } else {
                // Disabled
                view.setUint32(btnOffset, 0);
            }
        }

        // CRC16 계산 (마지막 2바이트)
        const crc = this.calculateCrc16(bytes.slice(0, 254));
        view.setUint16(254, crc, false);

        return bytes;
    }

    /**
     * 바이너리에서 프로필 파싱
     */
    binaryToProfile(data, index = 0) {
        const view = new DataView(data.buffer || data);
        const profile = this.createDefaultProfile(index);

        try {
            // 폴링 레이트
            const rateCode = view.getUint8(0);
            for (const [rate, code] of Object.entries(POLLING_RATES)) {
                if (code === rateCode) {
                    profile.pollingRate = parseInt(rate);
                    break;
                }
            }

            // 기본 DPI 단계
            profile.defaultDpiStage = view.getUint8(1);

            // DPI 단계 파싱
            for (let i = 0; i < 5; i++) {
                const offset = 4 + (i * 4);
                profile.dpiStages[i] = {
                    enabled: view.getUint8(offset) === 0x01,
                    x: view.getUint16(offset + 1, false),
                    y: view.getUint16(offset + 1, false), // 동일 값 사용
                    color: DPI_COLORS[i],
                };
            }

            // RGB 설정
            const rgbOffset = 32;
            const rgbMode = view.getUint8(rgbOffset);
            switch (rgbMode) {
                case RGB_MODES.OFF: profile.rgb.effect = 'off'; break;
                case RGB_MODES.STATIC: profile.rgb.effect = 'static'; break;
                case RGB_MODES.BREATHING: profile.rgb.effect = 'breathing'; break;
                case RGB_MODES.CYCLE: profile.rgb.effect = 'cycle'; break;
            }

            const r = view.getUint8(rgbOffset + 1).toString(16).padStart(2, '0');
            const g = view.getUint8(rgbOffset + 2).toString(16).padStart(2, '0');
            const b = view.getUint8(rgbOffset + 3).toString(16).padStart(2, '0');
            profile.rgb.color = `#${r}${g}${b}`;
            profile.rgb.brightness = Math.round(view.getUint8(rgbOffset + 4) / 2.55);
            profile.rgb.speed = view.getUint16(rgbOffset + 5, false);

            // 버튼 매핑 파싱
            const buttonOffset = 64;
            const buttonOrder = ['left', 'right', 'middle', 'back', 'forward', 'dpi', 'gshift'];

            for (let i = 0; i < buttonOrder.length; i++) {
                const btnOffset = buttonOffset + (i * 4);
                const type = view.getUint8(btnOffset);

                if (type === 0x80) {
                    // Button type
                    const code = view.getUint8(btnOffset + 1);
                    let value = 'click';
                    for (const [name, c] of Object.entries(SPECIAL_FUNCTIONS)) {
                        if (c === code) {
                            value = name;
                            break;
                        }
                    }
                    profile.buttons[buttonOrder[i]] = { action: 'button', value };
                } else if (type === 0x90) {
                    // Key type
                    const modifiers = view.getUint8(btnOffset + 1);
                    const keyCode = view.getUint8(btnOffset + 2);
                    let key = 'a';
                    for (const [name, c] of Object.entries(KEY_CODES)) {
                        if (c === keyCode) {
                            key = name;
                            break;
                        }
                    }
                    const mods = [];
                    if (modifiers & MODIFIER_CODES.ctrl) mods.push('ctrl');
                    if (modifiers & MODIFIER_CODES.shift) mods.push('shift');
                    if (modifiers & MODIFIER_CODES.alt) mods.push('alt');
                    if (modifiers & MODIFIER_CODES.win) mods.push('win');
                    profile.buttons[buttonOrder[i]] = { action: 'key', key, modifiers: mods };
                } else if (type === 0xa0) {
                    // Macro type
                    profile.buttons[buttonOrder[i]] = {
                        action: 'macro',
                        macroIndex: view.getUint8(btnOffset + 1),
                    };
                } else {
                    profile.buttons[buttonOrder[i]] = { action: 'disabled' };
                }
            }

        } catch (e) {
            console.error('Profile parsing error:', e);
        }

        return profile;
    }

    /**
     * CRC16-CCITT 계산
     */
    calculateCrc16(data) {
        let crc = 0xffff;
        for (const byte of data) {
            crc ^= byte << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
            }
            crc &= 0xffff;
        }
        return crc;
    }
}

// 전역 인스턴스
const profileManager = new ProfileManager();

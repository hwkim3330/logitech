/**
 * Logitech OMM - UI Components
 * UI 헬퍼 및 컴포넌트
 */

class UIManager {
    constructor() {
        this.toastContainer = null;
        this.modalOverlay = null;
        this.modal = null;
    }

    /**
     * 초기화
     */
    init() {
        this.toastContainer = document.getElementById('toastContainer');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');

        // 모달 이벤트
        document.getElementById('modalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.hideModal();
            }
        });
    }

    /**
     * 토스트 알림 표시
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * 성공 토스트
     */
    success(message) {
        this.showToast(message, 'success');
    }

    /**
     * 에러 토스트
     */
    error(message) {
        this.showToast(message, 'error', 5000);
    }

    /**
     * 경고 토스트
     */
    warning(message) {
        this.showToast(message, 'warning', 4000);
    }

    /**
     * 정보 토스트
     */
    info(message) {
        this.showToast(message, 'info');
    }

    /**
     * 모달 표시
     */
    showModal(title, content, onConfirm = null, onCancel = null) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;

        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        // 기존 이벤트 리스너 제거
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            this.hideModal();
        });

        newCancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            this.hideModal();
        });

        this.modalOverlay.classList.add('active');
    }

    /**
     * 모달 숨기기
     */
    hideModal() {
        this.modalOverlay.classList.remove('active');
    }

    /**
     * 확인 대화상자
     */
    confirm(title, message) {
        return new Promise((resolve) => {
            this.showModal(
                title,
                `<p>${message}</p>`,
                () => resolve(true),
                () => resolve(false)
            );
        });
    }

    /**
     * 연결 상태 업데이트
     */
    updateConnectionStatus(connected, deviceName = '') {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const connectBtn = document.getElementById('connectBtn');

        if (connected) {
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = deviceName || '연결됨';
            connectBtn.innerHTML = '<i class="fas fa-plug"></i> 연결 해제';
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = '연결 안됨';
            connectBtn.innerHTML = '<i class="fas fa-plug"></i> 마우스 연결';
        }
    }

    /**
     * 장치 정보 업데이트
     */
    updateDeviceInfo(info) {
        document.getElementById('deviceName').textContent = info.deviceName || info.name || '알 수 없는 장치';
        document.getElementById('devicePid').textContent = `0x${info.pid.toString(16).toUpperCase()}`;
        document.getElementById('deviceProtocol').textContent = info.protocol || 'HID++ 2.0';
        document.getElementById('deviceProfiles').textContent = info.profileCount || '3';
    }

    /**
     * 장치 정보 초기화
     */
    clearDeviceInfo() {
        document.getElementById('deviceName').textContent = '장치를 연결하세요';
        document.getElementById('devicePid').textContent = '-';
        document.getElementById('deviceProtocol').textContent = '-';
        document.getElementById('deviceProfiles').textContent = '-';
    }

    /**
     * 버튼 활성화/비활성화
     */
    setButtonsEnabled(enabled) {
        document.getElementById('applyBtn').disabled = !enabled;
        document.getElementById('exportBtn').disabled = !enabled;
        document.getElementById('importBtn').disabled = !enabled;
    }

    /**
     * 로딩 상태 표시
     */
    showLoading(button, loading = true) {
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
        }
    }

    /**
     * 프로필 목록 업데이트
     */
    updateProfileList(profiles, currentIndex) {
        const list = document.getElementById('profileList');
        list.innerHTML = '';

        profiles.forEach((profile, index) => {
            const item = document.createElement('div');
            item.className = `profile-item${index === currentIndex ? ' active' : ''}`;
            item.dataset.profile = index;
            item.innerHTML = `
                <span class="profile-number">${index + 1}</span>
                <span class="profile-name">${profile.name}</span>
            `;
            list.appendChild(item);
        });
    }

    /**
     * DPI 설정 UI 업데이트
     */
    updateDpiUI(profile) {
        const stages = document.querySelectorAll('.dpi-stage');

        stages.forEach((stage, index) => {
            const dpiData = profile.dpiStages[index];
            const checkbox = stage.querySelector('input[type="checkbox"]');
            const xInput = stage.querySelectorAll('.dpi-input')[0];
            const yInput = stage.querySelectorAll('.dpi-input')[1];
            const slider = stage.querySelector('.dpi-slider');
            const colorDot = stage.querySelector('.stage-color');

            checkbox.checked = dpiData.enabled;
            xInput.value = dpiData.x;
            yInput.value = dpiData.y;
            slider.value = dpiData.x;
            if (dpiData.color) {
                colorDot.style.background = dpiData.color;
            }

            stage.classList.toggle('active', index === profile.defaultDpiStage);
        });

        document.getElementById('defaultDpiStage').value = profile.defaultDpiStage + 1;
    }

    /**
     * 버튼 매핑 UI 업데이트
     */
    updateButtonsUI(profile) {
        const buttonItems = document.querySelectorAll('.button-item');

        buttonItems.forEach(item => {
            const button = item.dataset.button;
            const select = item.querySelector('.button-action');
            const mapping = profile.buttons[button];

            if (mapping) {
                if (mapping.action === 'button') {
                    select.value = mapping.value;
                } else if (mapping.action === 'key') {
                    select.value = 'key';
                } else if (mapping.action === 'macro') {
                    select.value = 'macro';
                } else {
                    select.value = 'disabled';
                }
            }
        });
    }

    /**
     * RGB UI 업데이트 (두 영역 지원)
     */
    updateRgbUI(profile) {
        const rgb = profile.rgb;

        // 기본적으로 로고 영역 설정을 표시 (동기화된 경우)
        const logoSettings = rgb.logo || rgb;
        const dpiSettings = rgb.dpi || rgb;

        document.getElementById('rgbEffect').value = logoSettings.effect;
        document.getElementById('rgbColor').value = logoSettings.color;
        document.getElementById('rgbColorHex').value = logoSettings.color;
        document.getElementById('rgbBrightness').value = logoSettings.brightness;
        document.getElementById('brightnessValue').textContent = logoSettings.brightness;
        document.getElementById('rgbSpeed').value = logoSettings.speed;
        document.getElementById('speedValue').textContent = logoSettings.speed;

        // 동기화 상태에 따라 버튼 활성화
        if (rgb.syncZones) {
            document.getElementById('zoneBoth')?.click();
        }

        // RGB 프리뷰 업데이트
        this.updateRgbPreview(rgb);

        // 효과에 따른 컨트롤 표시/숨김
        this.updateRgbControls(logoSettings.effect);
    }

    /**
     * RGB 프리뷰 업데이트 (두 영역)
     */
    updateRgbPreview(rgb) {
        const zone1 = document.getElementById('ledZone1'); // 로고
        const zone2 = document.getElementById('ledZone2'); // DPI

        // 각 영역별 설정 가져오기
        const logoSettings = rgb.logo || rgb;
        const dpiSettings = rgb.dpi || rgb;

        // 로고 LED 업데이트
        this.applyZoneEffect(zone1, logoSettings);

        // DPI LED 업데이트
        this.applyZoneEffect(zone2, dpiSettings);

        // SVG LED도 업데이트
        const svgLogo = document.getElementById('led-logo');
        const svgDpi = document.getElementById('led-dpi');
        if (svgLogo) {
            svgLogo.style.fill = logoSettings.effect === 'off' ? 'transparent' : logoSettings.color;
            svgLogo.style.filter = logoSettings.effect === 'off' ? 'none' : `drop-shadow(0 0 8px ${logoSettings.color})`;
        }
        if (svgDpi) {
            svgDpi.style.fill = dpiSettings.effect === 'off' ? 'transparent' : dpiSettings.color;
            svgDpi.style.filter = dpiSettings.effect === 'off' ? 'none' : `drop-shadow(0 0 5px ${dpiSettings.color})`;
        }
    }

    /**
     * 단일 LED 영역에 효과 적용
     */
    applyZoneEffect(zone, settings) {
        if (!zone) return;

        const brightness = (settings.brightness || 100) / 100;

        if (settings.effect === 'off') {
            zone.style.background = 'transparent';
            zone.style.boxShadow = 'none';
            zone.style.animation = 'none';
        } else if (settings.effect === 'cycle') {
            zone.style.animation = `rgbCycle ${settings.speed}ms linear infinite`;
            zone.style.boxShadow = `0 0 30px currentColor`;
            zone.style.opacity = brightness;
        } else {
            zone.style.animation = settings.effect === 'breathing' ?
                `breathing ${settings.speed}ms ease-in-out infinite` : 'none';
            zone.style.background = settings.color;
            zone.style.opacity = brightness;
            zone.style.boxShadow = `0 0 30px ${settings.color}`;
        }
    }

    /**
     * RGB 컨트롤 표시 업데이트
     */
    updateRgbControls(effect) {
        const colorPicker = document.getElementById('colorPicker');
        const brightnessControl = document.getElementById('brightnessControl');
        const speedControl = document.getElementById('speedControl');

        colorPicker.style.display = (effect === 'static' || effect === 'breathing') ? 'flex' : 'none';
        brightnessControl.style.display = effect !== 'off' ? 'flex' : 'none';
        speedControl.style.display = (effect === 'breathing' || effect === 'cycle') ? 'flex' : 'none';
    }

    /**
     * 고급 설정 UI 업데이트
     */
    updateAdvancedUI(profile) {
        // 폴링 레이트
        const pollingInputs = document.querySelectorAll('input[name="polling"]');
        pollingInputs.forEach(input => {
            input.checked = parseInt(input.value) === profile.pollingRate;
        });

        // 온보드 모드
        document.getElementById('onboardMode').checked = true; // 기본 활성화

        // 앵글 스내핑
        document.getElementById('angleSnapping').checked = profile.angleSnapping;

        // LOD
        document.getElementById('lodSetting').value = profile.lod;
    }

    /**
     * 전체 UI 업데이트
     */
    updateAllUI(profile) {
        this.updateDpiUI(profile);
        this.updateButtonsUI(profile);
        this.updateRgbUI(profile);
        this.updateAdvancedUI(profile);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes rgbCycle {
        0% { background: #ff0000; }
        17% { background: #ffff00; }
        33% { background: #00ff00; }
        50% { background: #00ffff; }
        67% { background: #0000ff; }
        83% { background: #ff00ff; }
        100% { background: #ff0000; }
    }

    @keyframes breathing {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// 전역 인스턴스
const ui = new UIManager();

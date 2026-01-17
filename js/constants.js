/**
 * Logitech OMM - Constants
 * HID++ 프로토콜 상수 및 마우스 정보
 */

// Logitech Vendor ID
const LOGITECH_VID = 0x046d;

// 지원되는 마우스 모델
const SUPPORTED_DEVICES = {
    0xc07d: { name: 'G502 Proteus Core', buttons: 11, maxDpi: 12000 },
    0xc08b: { name: 'G502 HERO', buttons: 11, maxDpi: 25600 },
    0xc08d: { name: 'G502 LIGHTSPEED', buttons: 11, maxDpi: 25600 },
    0xc094: { name: 'G502 X', buttons: 13, maxDpi: 25600 },
    0xc095: { name: 'G502 X LIGHTSPEED', buttons: 13, maxDpi: 25600 },
    0xc096: { name: 'G502 X PLUS', buttons: 13, maxDpi: 25600 },
    0xc092: { name: 'G PRO X SUPERLIGHT', buttons: 5, maxDpi: 25600 },
    0xc088: { name: 'G PRO Wireless', buttons: 8, maxDpi: 25600 },
    0xc084: { name: 'G203 Prodigy', buttons: 6, maxDpi: 8000 },
    0xc090: { name: 'G305', buttons: 6, maxDpi: 12000 },
    0xc082: { name: 'G403 Prodigy', buttons: 6, maxDpi: 12000 },
    0xc083: { name: 'G403 Hero', buttons: 6, maxDpi: 25600 },
    0xc07e: { name: 'G402', buttons: 8, maxDpi: 4000 },
    0xc539: { name: 'G903 HERO', buttons: 11, maxDpi: 25600 },
    0xc541: { name: 'G903 LIGHTSPEED', buttons: 11, maxDpi: 25600 },
};

// HID++ 프로토콜 상수
const HIDPP = {
    // Report IDs
    REPORT_SHORT: 0x10,
    REPORT_LONG: 0x11,
    REPORT_VERY_LONG: 0x12,

    // Device indices
    DEVICE_WIRED: 0xff,
    DEVICE_RECEIVER: 0x01,
    DEVICE_BLUETOOTH: 0x00,

    // Software ID (하위 4비트)
    SW_ID: 0x01,

    // Feature IDs
    FEATURES: {
        ROOT: 0x0000,
        FEATURE_SET: 0x0001,
        DEVICE_INFO: 0x0003,
        DEVICE_NAME: 0x0005,
        DEVICE_TYPE: 0x0020,
        DFU: 0x00c0,
        BATTERY_STATUS: 0x1000,
        BATTERY_VOLTAGE: 0x1001,
        LED_CONTROL: 0x1300,
        BACKLIGHT: 0x1981,
        RGB_EFFECTS: 0x8071,
        PER_KEY_LIGHTING: 0x8081,
        ONBOARD_PROFILES: 0x8100,
        MOUSE_BUTTON_SPY: 0x8110,
        REPROG_CONTROLS: 0x1b00,
        REPROG_CONTROLS_V4: 0x1b04,
        ADJUSTABLE_DPI: 0x2201,
        ANGLE_SNAPPING: 0x2230,
        SURFACE_TUNING: 0x2240,
        REPORT_RATE: 0x8060,
        SPECIAL_KEYS: 0x1b00,
    },

    // Error codes
    ERRORS: {
        NO_ERROR: 0x00,
        UNKNOWN: 0x01,
        INVALID_ARGUMENT: 0x02,
        OUT_OF_RANGE: 0x03,
        HW_ERROR: 0x04,
        LOGITECH_INTERNAL: 0x05,
        INVALID_FEATURE_INDEX: 0x06,
        INVALID_FUNCTION_ID: 0x07,
        BUSY: 0x08,
        UNSUPPORTED: 0x09,
    }
};

// RGB 모드
const RGB_MODES = {
    OFF: 0,
    STATIC: 1,
    CYCLE: 3,
    BREATHING: 10,
};

// 마우스 버튼 ID
const MOUSE_BUTTONS = {
    LEFT_CLICK: 0x50,
    RIGHT_CLICK: 0x51,
    MIDDLE_CLICK: 0x52,
    BACK: 0x53,
    FORWARD: 0x56,
    SCROLL_UP: 0x54,
    SCROLL_DOWN: 0x55,
    DPI_UP: 0x4d,
    DPI_DOWN: 0x4e,
    DPI_CYCLE: 0x4f,
    DPI_SHIFT: 0x57,
    GSHIFT: 0x58,
    PROFILE_CYCLE: 0x5b,
    DISABLED: 0x00,
};

// 특수 기능 매핑
const SPECIAL_FUNCTIONS = {
    click: MOUSE_BUTTONS.LEFT_CLICK,
    context: MOUSE_BUTTONS.RIGHT_CLICK,
    middle_click: MOUSE_BUTTONS.MIDDLE_CLICK,
    back: MOUSE_BUTTONS.BACK,
    forward: MOUSE_BUTTONS.FORWARD,
    dpi_up: MOUSE_BUTTONS.DPI_UP,
    dpi_down: MOUSE_BUTTONS.DPI_DOWN,
    dpi_cycle: MOUSE_BUTTONS.DPI_CYCLE,
    dpi_shift: MOUSE_BUTTONS.DPI_SHIFT,
    gshift: MOUSE_BUTTONS.GSHIFT,
    profile_cycle: MOUSE_BUTTONS.PROFILE_CYCLE,
    scroll_mode: 0x5a,
    disabled: MOUSE_BUTTONS.DISABLED,
};

// USB HID 키코드
const KEY_CODES = {
    a: 0x04, b: 0x05, c: 0x06, d: 0x07, e: 0x08, f: 0x09,
    g: 0x0a, h: 0x0b, i: 0x0c, j: 0x0d, k: 0x0e, l: 0x0f,
    m: 0x10, n: 0x11, o: 0x12, p: 0x13, q: 0x14, r: 0x15,
    s: 0x16, t: 0x17, u: 0x18, v: 0x19, w: 0x1a, x: 0x1b,
    y: 0x1c, z: 0x1d,
    '1': 0x1e, '2': 0x1f, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    Enter: 0x28, Escape: 0x29, Backspace: 0x2a, Tab: 0x2b,
    ' ': 0x2c, '-': 0x2d, '=': 0x2e, '[': 0x2f, ']': 0x30,
    '\\': 0x31, ';': 0x33, "'": 0x34, '`': 0x35, ',': 0x36,
    '.': 0x37, '/': 0x38,
    CapsLock: 0x39,
    F1: 0x3a, F2: 0x3b, F3: 0x3c, F4: 0x3d, F5: 0x3e, F6: 0x3f,
    F7: 0x40, F8: 0x41, F9: 0x42, F10: 0x43, F11: 0x44, F12: 0x45,
    PrintScreen: 0x46, ScrollLock: 0x47, Pause: 0x48,
    Insert: 0x49, Home: 0x4a, PageUp: 0x4b, Delete: 0x4c,
    End: 0x4d, PageDown: 0x4e,
    ArrowRight: 0x4f, ArrowLeft: 0x50, ArrowDown: 0x51, ArrowUp: 0x52,
    NumLock: 0x53,
};

// 수정키 코드
const MODIFIER_CODES = {
    ctrl: 0x01,
    shift: 0x02,
    alt: 0x04,
    win: 0x08,
    lctrl: 0x01,
    lshift: 0x02,
    lalt: 0x04,
    lgui: 0x08,
    rctrl: 0x10,
    rshift: 0x20,
    ralt: 0x40,
    rgui: 0x80,
};

// 폴링 레이트 값
const POLLING_RATES = {
    125: 0x08,
    250: 0x04,
    500: 0x02,
    1000: 0x01,
};

// DPI 범위
const DPI_RANGE = {
    min: 100,
    max: 25600,
    step: 50,
};

// 기본 DPI 색상
const DPI_COLORS = [
    '#00ff00', // 녹색
    '#ffff00', // 노랑
    '#00ffff', // 시안
    '#ff00ff', // 마젠타
    '#ff0000', // 빨강
];

// 기본 프로필
const DEFAULT_PROFILE = {
    name: 'Default',
    dpiStages: [
        { enabled: true, x: 800, y: 800 },
        { enabled: true, x: 1600, y: 1600 },
        { enabled: true, x: 3200, y: 3200 },
        { enabled: false, x: 6400, y: 6400 },
        { enabled: false, x: 12800, y: 12800 },
    ],
    defaultDpiStage: 1,
    pollingRate: 1000,
    angleSnapping: false,
    lod: 'medium',
    rgb: {
        effect: 'static',
        color: '#00ff00',
        brightness: 100,
        speed: 1000,
    },
    buttons: {
        left: 'click',
        right: 'context',
        middle: 'middle_click',
        back: 'back',
        forward: 'forward',
        dpi: 'dpi_cycle',
        gshift: 'gshift',
    },
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LOGITECH_VID,
        SUPPORTED_DEVICES,
        HIDPP,
        RGB_MODES,
        MOUSE_BUTTONS,
        SPECIAL_FUNCTIONS,
        KEY_CODES,
        MODIFIER_CODES,
        POLLING_RATES,
        DPI_RANGE,
        DPI_COLORS,
        DEFAULT_PROFILE,
    };
}

export const CONFIG = {
  RADIUS_SCALE: 0.34,
  BASE_LINE_WIDTH_SCALE: 0.003,
  VERTEX_RADIUS_SCALE: 0.03,
  VERTEX_LINE_WIDTH_SCALE: 0.0075,
  TEMP_LINE_WIDTH_SCALE: 0.015,
  ARC_BASE_RADIUS_SCALE: 0.07,
  ARC_RING_SPACING_SCALE: 0.035,
  SKIP_DASH_SCALE: [0.015, 0.07],
  SKIP_LINE_WIDTH_SCALE: 0.012,
  MARKER_LINE_WIDTH_SCALE: 0.015,
  ACTION_CURVE_OFFSET_SCALE: 0.15,
  CONNECTION_LINE_WIDTH_SCALE: 0.017
};

export const ICON_CONFIG = {
    ICON_OFFSET_SCALE: 0.24,
    ICON_BASE_SIZE_SCALE: 0.18,
    ICON_FONT_SIZE_RATIO: 0.45,
    STEP_ICON_SCALE: {
        0: 1.3,
        1: 1.3,
        2: 1.1,
        3: 1.1,
        4: 1.7,
        5: 1.7,
        6: 1.7,
        7: 1.7
    },
    STEP_TITLES: [
        "NATURA",
        "MOC",
        "EFEKT",
        "FORMA",
        "ODLEGLOŚĆ",
        "OBSZAR",
        "CZAS TRWANIA",
        "OPÓŹNIENIE"
    ]
};


export const LOGIC_CONFIG = {
    ACTION_LIMIT: 8,
    START_THRESHOLD_SCALE: 0.35,
    END_THRESHOLD_SCALE: 0.35,
    TAP_THRESHOLD_SCALE: 0.35,
    MIN_ACTIONS_FOR_SKIP: 4,
    POINT_COUNT: 8,
    RADIUS_SCALE: 0.34
};

export const SPELL_CONFIG = {
    CODE_LENGTH: 8,
    MAX_INDEX: 8,
    CUSTOM_ORDER: [7, 6, 5, 4, 3, 2, 0, 1],
    DATA_TYPES: [
        ['elementem chaosu ', 'elementem światła ', 'elemetem ognia ', 'elementem wody ',
         'elementem ziemii ', 'elementem powietrza ', 'elementem psychicznym ', 'elementem śmierci '],
        ['za K100.', 'za K2.', 'za K4.', 'za K6.', 'za K8.', 'za K10.', 'za K12.', 'za K20.'],
        ['wylosuj ', 'przemieść ', 'zaatakuj ', 'ulecz ', 'obroń ', 'okryj ', 'pokaż ', 'zniszcz '],
        ['z użyciem kreacji ', 'z użyciem dotyku ', 'z użyciem wybuchu ', 'z użyciem plamy ',
         'z użyciem ściany ', 'z użyciem pocisku ', 'z użyciem iluzji ', 'z użyciem przywołania '],
        ['i w zasięgu 9, ', ' i w zasięgu 2, ', 'i w zasięgu 3, ', 'i w zasięgu 4, ',
         'i w zasięgu 5, ', 'i w zasięgu 6, ', 'i w zasięgu 7, ', 'i w zasięgu 8, ',
         'i w zasięgu 1, '],
        ['w obszarze 9 pól ', 'w obszarze 2 pól ', 'w obszarze 3 pól ', 'w obszarze 4 pól ',
         'w obszarze 5 pól ', 'w obszarze 6 pól ', 'w obszarze 7 pól ', 'w obszarze 8 pól ',
         'w obszarze 1 pola '],
        ['przez następne 9, ', 'przez następne 2, ', 'przez następne 3, ',
         'przez następne 4, ', 'przez następne 5, ', 'przez następne 6, ',
         'przez następne 7, ', 'przez następne 8, ', 'przez 1, '],
        ['Za 9 tur, ', 'Za 2 tury, ', 'Za 3 tury, ', 'Za 4 tury, ', 'Za 5 tur, ', 'Za 6 tur, ',
         'Za 7 tur, ', 'Za 8 tur, ', 'W tej turze, ']
    ]
};

// Action Types
const SET_MOBILE_VIEW = "scratch-gui/orientation/SET_MOBILE_VIEW";
const SET_ORIENTATION = "scratch-gui/orientation/SET_ORIENTATION";

// Initial State
const initialState = {
    orientation: 'landscape',
    mobileView: true,
};

// Reducer
const reducer = function (state = initialState, action) {
    switch (action.type) {
        case SET_MOBILE_VIEW:
            return { ...state, mobileView: action.mobileView };
        case SET_ORIENTATION:
            return { ...state, orientation: action.orientation };
        default:
            return state;
    }
};

// Action Creators
const setMobileView = function (isMobileView) {
    return {
        type: SET_MOBILE_VIEW,
        mobileView: isMobileView,
    };
};

const setOrientation = function (orientation) {
    return {
        type: SET_ORIENTATION,  
        orientation,
    };
};

export {
    reducer as default,
    initialState as orientationInitialState,
    setMobileView,
    setOrientation,
};

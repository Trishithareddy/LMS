const UPDATE_BLOCKS = 'scratch-gui/select-blocks/UPDATE_BLOCKS';

const initialState = {
    motion: {
        showMotionCategory: true,
        motion_move_block: true,
        motion_turn_right_block: true,
        motion_turn_left_block: true,
        motion_goto: true,
        motion_gotoxy: true,
        motion_glideto: true,
        motion_glidesecstoxy: true,
        motion_pointindirection: true,
        motion_pointtowards: true,
        motion_changexby: true,
        motion_setx: true,
        motion_changeyby: true,
        motion_sety: true,
        motion_ifonedgebounce: true,
        motion_setrotationstyle: true,
        motion_xyposition_direction: true,
    },
    // Add other categories as necessary
    looks: {
        showlooksCategory: true,
        looks_sayforsecs: true,
        looks_say: true,
        looks_thinkforsecs: true,
        looks_think: true,
        looks_switchbackdropto: true,
        looks_switchbackdroptoandwait: true,
        looks_nextbackdrop: true,
        looks_switchcostumeto: true,
        looks_nextcostume: true,
        looks_changesizeby: true,
        looks_setsizeto: true,
        looks_changeeffectby: true,
        looks_seteffectto: true,
        looks_cleargraphiceffects: true,
        looks_show_hide: true,
        looks_gotofrontback: true,
        looks_goforwardbackwardlayers: true,
        looks_backdropnumbername: true,
        looks_numbername_size: true,
    },
    sound: {
        showsoundCategory: true,
        sound_playuntildone: true,
        sound_play: true,
        sound_stopallsounds: true,
        sound_changeeffectby: true,
        sound_seteffectto: true,
        sound_cleareffects: true,
        sound_changevolumeby: true,
        sound_setvolumeto: true,
        sound_volume: true,
    },
    event: {
        showeventCategory: true,
        event_whenflagclicked: true,
        event_whenkeypressed: true,
        event_whenstageclicked: true,
        event_whenthisspriteclicked: true,
        event_whenbackdropswitchesto: true,
        event_whengreaterthan: true,
        event_whenbroadcastreceived: true,
        event_broadcast: true,
        event_broadcastandwait: true,
    },
    control: {
        showcontrolCategory: true,
        control_wait: true,
        control_repeat: true,
        control_forever: true,
        control_if: true,
        control_if_else: true,
        control_wait_until: true,
        control_repeat_until: true,
        control_stop: true,
        control_create_clone_of: true,
        control_start_as_clone: true,
        control_delete_this_clone: true,
    },
    sensing: {
        showsensingCategory: true,
        sensing_touchingobject: true,
        sensing_touchingcolor: true,
        sensing_coloristouchingcolor: true,
        sensing_distanceto: true,
        sensing_askandwait: true,
        sensing_answer: true,
        sensing_keypressed: true,
        sensing_mousedown: true,
        sensing_mousex: true,
        sensing_mousey: true,
        sensing_setdragmode: true,
        sensing_loudness: true,
        sensing_timer: true,
        sensing_resettimer: true,
        sensing_of: true,
        sensing_current: true,
        sensing_dayssince2000: true,
        sensing_username: true,
    },
    operators: {
        showoperatorsCategory: true,
        operator_add: true,
        operator_subtract: true,
        operator_multiply: true,
        operator_divide: true,
        operator_random: true,
        operator_gt: true,
        operator_lt: true,
        operator_equals: true,
        operator_and: true,
        operator_or: true,
        operator_not: true,
        operator_join: true,
        operator_letter_of: true,
        operator_length: true,
        operator_contains: true,
        operator_mod: true,
        operator_round: true,
        operator_mathop: true,
    },
    variables:{
       showvariablesCategory:true,
       variables_myvariable:true,
       variables_setto:true,
       variables_changeby:true,
       variables_showvariable:true,
       variables_hidevariable:true,
    },
    myblocks:{
        showmyblocksCategory:true,
        myblocks_makeablock: true,
    }

};

// Reducer function
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case UPDATE_BLOCKS:
            return {
                ...state,
                motion: {
                    ...state.motion, // Preserve existing motion state
                    ...action.payload.motion // Merge new motion preferences
                },
                // Handle additional categories similarly
                looks: {
                    ...state.looks,
                    ...action.payload.looks
                },
                sound: {
                    ...state.sound,
                    ...action.payload.sound
                },
                event: {
                    ...state.event,
                    ...action.payload.event
                },
                control: {
                    ...state.control,
                    ...action.payload.control
                },
                sensing: {
                    ...state.sensing,
                    ...action.payload.sensing
                },
                operators: {
                    ...state.operators,
                    ...action.payload.operators
                },
                variables: {
                    ...state.variables,
                    ...action.payload.variables
                },
                myblocks: {
                    ...state.myblocks,
                    ...action.payload.myblocks
                }
            };
        default:
            return state;
    }
};

// Action creator
const updateBlocks = (preferences) => ({
    type: UPDATE_BLOCKS,
    payload: preferences, // Expects an object with the structure: { motion: {...}, sound: {...} }
});

export {
    reducer as default,
    initialState as selectBlocksInitialState,
    updateBlocks
};
// reducers/LMStoScratch.js

const SET_PROJECT_DATA = 'scratch-gui/LMStoScratch/SET_PROJECT_DATA';

const initialState = {
    projectData: {
        ScratchDescription: '',
        ScratchFile: {
            type: '',
            data: []
        },
        ScratchInstruction: '',
        ScratchTitle: '',
        SelectBlock: [
            {
                blockCategory: 'motion',
                subSelectedBlock: [
                    { subBlockName: 'motion_move_block', value: true },
                    { subBlockName: 'motion_turn_right_block', value: true },
                    { subBlockName: 'motion_turn_left_block', value: true },
                    { subBlockName: 'motion_goto', value: true },
                    { subBlockName: 'motion_gotoxy', value: true },
                    { subBlockName: 'motion_glideto', value: true },
                    { subBlockName: 'motion_glidesecstoxy', value: true },
                    { subBlockName: 'motion_pointindirection', value: true },
                    { subBlockName: 'motion_pointtowards', value: true },
                    { subBlockName: 'motion_changexby', value: true },
                    { subBlockName: 'motion_setx', value: true },
                    { subBlockName: 'motion_changeyby', value: true },
                    { subBlockName: 'motion_sety', value: true },
                    { subBlockName: 'motion_ifonedgebounce', value: true },
                    { subBlockName: 'motion_setrotationstyle', value: true },
                    { subBlockName: 'motion_xyposition_direction', value: true }
                ]
            },
            {
                blockCategory: 'looks',
                subSelectedBlock: [
                    { subBlockName: 'looks_sayforsecs', value: true },
                    { subBlockName: 'looks_say', value: true },
                    { subBlockName: 'looks_thinkforsecs', value: true },
                    { subBlockName: 'looks_think', value: true },
                    { subBlockName: 'looks_switchbackdropto', value: true },
                    { subBlockName: 'looks_switchbackdroptoandwait', value: true },
                    { subBlockName: 'looks_nextbackdrop', value: true },
                    { subBlockName: 'looks_switchcostumeto', value: true },
                    { subBlockName: 'looks_nextcostume', value: true },
                    { subBlockName: 'looks_changesizeby', value: true },
                    { subBlockName: 'looks_setsizeto', value: true },
                    { subBlockName: 'looks_changeeffectby', value: true },
                    { subBlockName: 'looks_seteffectto', value: true },
                    { subBlockName: 'looks_cleargraphiceffects', value: true },
                    { subBlockName: 'looks_show_hide', value: true },
                    { subBlockName: 'looks_gotofrontback', value: true },
                    { subBlockName: 'looks_goforwardbackwardlayers', value: true },
                    { subBlockName: 'looks_backdropnumbername', value: true },
                    { subBlockName: 'looks_numbername_size', value: true }
                ]
            },
            {
                blockCategory: 'sound',
                subSelectedBlock: [
                    { subBlockName: 'sound_playuntildone', value: true },
                    { subBlockName: 'sound_play', value: true },
                    { subBlockName: 'sound_stopallsounds', value: true },
                    { subBlockName: 'sound_changeeffectby', value: true },
                    { subBlockName: 'sound_seteffectto', value: true },
                    { subBlockName: 'sound_cleareffects', value: true },
                    { subBlockName: 'sound_changevolumeby', value: true },
                    { subBlockName: 'sound_setvolumeto', value: true },
                    { subBlockName: 'sound_volume', value: true }
                ]
            },
            {
                blockCategory: 'events',
                subSelectedBlock: [
                    { subBlockName: 'event_whenflagclicked', value: true },
                    { subBlockName: 'event_whenkeypressed', value: true },
                    { subBlockName: 'event_whenstageclicked', value: true },
                    { subBlockName: 'event_whenthisspriteclicked', value: true },
                    { subBlockName: 'event_whenbackdropswitchesto', value: true },
                    { subBlockName: 'event_whengreaterthan', value: true },
                    { subBlockName: 'event_whenbroadcastreceived', value: true },
                    { subBlockName: 'event_broadcast', value: true },
                    { subBlockName: 'event_broadcastandwait', value: true }
                ]
            },
            {
                blockCategory: 'control',
                subSelectedBlock: [
                    { subBlockName: 'control_wait', value: true },
                    { subBlockName: 'control_repeat', value: true },
                    { subBlockName: 'control_forever', value: true },
                    { subBlockName: 'control_if', value: true },
                    { subBlockName: 'control_if_else', value: true },
                    { subBlockName: 'control_wait_until', value: true },
                    { subBlockName: 'control_repeat_until', value: true },
                    { subBlockName: 'control_stop', value: true },
                    { subBlockName: 'control_create_clone_of', value: true },
                    { subBlockName: 'control_start_as_clone', value: true },
                    { subBlockName: 'control_delete_this_clone', value: true }
                ]
            },
            {
                blockCategory: 'sensing',
                subSelectedBlock: [
                    { subBlockName: 'sensing_touchingobject', value: true },
                    { subBlockName: 'sensing_touchingcolor', value: true },
                    { subBlockName: 'sensing_coloristouchingcolor', value: true },
                    { subBlockName: 'sensing_distanceto', value: true },
                    { subBlockName: 'sensing_askandwait', value: true },
                    { subBlockName: 'sensing_answer', value: true },
                    { subBlockName: 'sensing_keypressed', value: true },
                    { subBlockName: 'sensing_mousedown', value: true },
                    { subBlockName: 'sensing_mousex', value: true },
                    { subBlockName: 'sensing_mousey', value: true },
                    { subBlockName: 'sensing_setdragmode', value: true },
                    { subBlockName: 'sensing_loudness', value: true },
                    { subBlockName: 'sensing_timer', value: true },
                    { subBlockName: 'sensing_resettimer', value: true },
                    { subBlockName: 'sensing_of', value: true },
                    { subBlockName: 'sensing_current', value: true },
                    { subBlockName: 'sensing_dayssince2000', value: true },
                    { subBlockName: 'sensing_username', value: true }
                ]
            },
            {
                blockCategory: 'operators',
                subSelectedBlock: [
                    { subBlockName: 'operator_add', value: true },
                    { subBlockName: 'operator_subtract', value: true },
                    { subBlockName: 'operator_multiply', value: true },
                    { subBlockName: 'operator_divide', value: true },
                    { subBlockName: 'operator_random', value: true },
                    { subBlockName: 'operator_gt', value: true },
                    { subBlockName: 'operator_lt', value: true },
                    { subBlockName: 'operator_equals', value: true },
                    { subBlockName: 'operator_and', value: true },
                    { subBlockName: 'operator_or', value: true },
                    { subBlockName: 'operator_not', value: true },
                    { subBlockName: 'operator_join', value: true },
                    { subBlockName: 'operator_letter_of', value: true },
                    { subBlockName: 'operator_length', value: true },
                    { subBlockName: 'operator_contains', value: true },
                    { subBlockName: 'operator_mod', value: true },
                    { subBlockName: 'operator_round', value: true },
                    { subBlockName: 'operator_mathop', value: true }
                ]
            },
            {
                blockCategory: 'variables',
                subSelectedBlock: [
                    { subBlockName: 'variables_myvariable', value: true },
                    { subBlockName: 'variables_setto', value: true },
                    { subBlockName: 'variables_changeby', value: true },
                    { subBlockName: 'variables_showvariable', value: true },
                    { subBlockName: 'variables_hidevariable', value: true }
                ]
            },
            {
                blockCategory: 'myblocks',
                subSelectedBlock: [
                    { subBlockName: 'myblocks_makeablock', value: true }
                ]
            }
        ],
        createdAt: '',
        _id: ''
    }
};

const reducer = function (state = initialState, action) {
    switch (action.type) {
        case SET_PROJECT_DATA:
            return {
                projectData: {
                    ...initialState.projectData,  // Spread initial state
                    ...action.projectData,        // Override with new data
                    SelectBlock: action.projectData?.SelectBlock || initialState.projectData.SelectBlock
                }
            };
        default:
            return state;
    }
};

const setProjectData = function (projectData) {
    return {
        type: SET_PROJECT_DATA,
        projectData: projectData
    };
};

export {
    reducer as default,
    initialState as LMStoScratchInitialState,
    setProjectData
};
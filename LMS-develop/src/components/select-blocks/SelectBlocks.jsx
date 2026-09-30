import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateBlocks } from "../../reducers/select-blocks";
import PropTypes from "prop-types";
import styles from "./select-blocks.css";
// importing mostion images
import MotionMoveBlock from "./selector-images/motion-images/motion-moveblock.png";
import MotionTurnRight from "./selector-images/motion-images/motion-turnRightBlock.png";
import MotionTurnLeftBlock from "./selector-images/motion-images/motion-turnLeftBlock.png";
import MotionGoto from "./selector-images/motion-images/motion-goto.png";
import MotionGoToxy from "./selector-images/motion-images/motion-gotxy.png";
import MotionGlideto from "./selector-images/motion-images/motion-glideto.png";
import MotionChnagexby from "./selector-images/motion-images/motion-changexby.png";
import MotionChnageyby from "./selector-images/motion-images/motion-changeyby.png";
import MotionGlideSecsToxy from "./selector-images/motion-images/motion-glideSecsToxy.png";
import MotionPointDirection from "./selector-images/motion-images/motion-pointDirection.png";
import MotionsetXto from "./selector-images/motion-images/motion-setxto.png";
import MotionSetYto from "./selector-images/motion-images/motion-setyto.png";
import MotionTowords from "./selector-images/motion-images/motion-towords.png";
import Motion_ifonEdgeBounce from "./selector-images/motion-images/motion-ifonEdgeBounce.png";
import Motion_setRotationStyle from "./selector-images/motion-images/motion-setRotationStyle.png";
import Motion_xyPositonDirection from "./selector-images/motion-images/motion-xyPostionDirection.png";
//importing looks images
import looksBackDropNumberName from "./selector-images/looks-images/looks_backdropnumbername.png";
import looks_changeEffectby from "./selector-images/looks-images/looks_changeeffectby.png";
import looks_changeSizeby from "./selector-images/looks-images/looks_changesizeby.png";
import looks_clearGraphicEffects from "./selector-images/looks-images/looks_cleargraphiceffects.png";
import looks_goForwardBackwardlayers from "./selector-images/looks-images/looks_goforwardbackwardlayers.png";
import looks_gotoFrontBack from "./selector-images/looks-images/looks_gotofrontback.png";
import looks_nextBackdrop from "./selector-images/looks-images/looks_nextbackdrop.png";
import looks_nextCostume from "./selector-images/looks-images/looks_nextcostume.png";
import looks_numberName_size from "./selector-images/looks-images/looks_numbername_size.png";
import looks_say from "./selector-images/looks-images/looks_say.png";
import looks_sayForSecs from "./selector-images/looks-images/looks_sayforsecs.png";
import looks_setEffectto from "./selector-images/looks-images/looks_seteffectto.png";
import looks_setSizeto from "./selector-images/looks-images/looks_setsizeto.png";
import looks_show_hide from "./selector-images/looks-images/looks_show_hide.png";
import looks_switchCostumeto from "./selector-images/looks-images/looks_switchcostumeto.png";
import looks_switchBackdropto from "./selector-images/looks-images/looks_switchbackdropto.png";
import looks_think from "./selector-images/looks-images/looks_think.png";
import looks_thinkForsecs from "./selector-images/looks-images/looks_thinkforsecs.png";
//importing sounds images
import soundChangeEffectby from "./selector-images/sound-images/sound_changeeffectby.png";
import soundChangeVolumeby from "./selector-images/sound-images/sound_changevolumeby.png";
import soundPlayUntilDone from "./selector-images/sound-images/sound_playuntildone.png";
import soundSetEffectto from "./selector-images/sound-images/sound_seteffectto.png";
import soundSetVolumeto from "./selector-images/sound-images/sound_setvolumeto.png";
import soundStopallSounds from "./selector-images/sound-images/sound_stopallsounds.png";
import soundVolume from "./selector-images/sound-images/sound_volume.png";
import soundPlay from "./selector-images/sound-images/sound_play.png";
import soundClearEffect from "./selector-images/sound-images/sound_cleareffects.png";
// importing event images
import eventBroadcast from "./selector-images/events-images/event_broadcast.png";
import eventbroadcastandwait from "./selector-images/events-images/event_broadcastandwait.png";
import eventwhenBackDropSwitchesto from "./selector-images/events-images/event_whenbackdropswitchesto.png";
import eventwhenBroadcastReceived from "./selector-images/events-images/event_whenbroadcastreceived.png";
import eventwhenFlagClicked from "./selector-images/events-images/event_whenflagclicked.png";
import eventwhenGreaterthan from "./selector-images/events-images/event_whengreaterthan.png";
import eventwhenKeyPressed from "./selector-images/events-images/event_whenkeypressed.png";
import eventwhenThisSpriteClicked from "./selector-images/events-images/event_whenthisspriteclicked.png";
// importing controls images
import controlCreateCloneof from "./selector-images/controls-images/control_create_clone_of.png";
import controlDeleteThisClone from "./selector-images/controls-images/control_delete_this_clone.png";
import controlForever from "./selector-images/controls-images/control_forever.png";
import controlif from "./selector-images/controls-images/control_if.png";
import controlifelse from "./selector-images/controls-images/control_if_else.png";
import controlRepeat from "./selector-images/controls-images/control_repeat.png";
import controlRepeatUntil from "./selector-images/controls-images/control_repeat_until.png";
import controlStartasClone from "./selector-images/controls-images/control_start_as_clone.png";
import controlStop from "./selector-images/controls-images/control_stop.png";
import controlWait from "./selector-images/controls-images/control_wait.png";
import controlWaitUntil from "./selector-images/controls-images/control_wait_until.png";
//import sensing images
import sensingAnswer from "./selector-images/sensing-images/sensing_answer.png";
import sensingAskandwait from "./selector-images/sensing-images/sensing_askandwait.png";
import sensingColoristouchingcolor from "./selector-images/sensing-images/sensing_coloristouchingcolor.png";
import sensingCurrent from "./selector-images/sensing-images/sensing_current.png";
import sensingDayssince2000 from "./selector-images/sensing-images/sensing_dayssince2000.png";
import sensingDistanceto from "./selector-images/sensing-images/sensing_distanceto.png";
import sensingKeyPressed from "./selector-images/sensing-images/sensing_keypressed.png";
import sensingLoudness from "./selector-images/sensing-images/sensing_loudness.png";
import sensingMousedown from "./selector-images/sensing-images/sensing_mousedown.png";
import sensingMousex from "./selector-images/sensing-images/sensing_mousex.png";
import sensingMousey from "./selector-images/sensing-images/sensing_mousey.png";
import sensingof from "./selector-images/sensing-images/sensing_of.png";
import sensingResettimer from "./selector-images/sensing-images/sensing_resettimer.png";
import sensingSetdragmode from "./selector-images/sensing-images/sensing_setdragmode.png";
import sensingTimer from "./selector-images/sensing-images/sensing_timer.png";
import sensingTouchingcolor from "./selector-images/sensing-images/sensing_touchingcolor.png";
import sensingTouchingobject from "./selector-images/sensing-images/sensing_touchingobject.png";
import sensingUsername from "./selector-images/sensing-images/sensing_username.png";
// importing opretors image
import OperatorAdd from "./selector-images/operators-images/operator_add.png";
import OperatorSubtract from "./selector-images/operators-images/operator_subtract.png";
import OperatorDivide from "./selector-images/operators-images/operator_divide.png";
import OperatorMultiply from "./selector-images/operators-images/operator_multiply.png";
import OperatorAnd from "./selector-images/operators-images/operator_and.png";
import OperatorContains from "./selector-images/operators-images/operator_contains.png";
import OperatorEquals from "./selector-images/operators-images/operator_equals.png";
import Operatorgt from "./selector-images/operators-images/operator_gt.png";
import OperatorJoin from "./selector-images/operators-images/operator_join.png";
import OperatorLength from "./selector-images/operators-images/operator_length.png";
import OperatorLetter_of from "./selector-images/operators-images/operator_letter_of.png";
import Operatorlt from "./selector-images/operators-images/operator_lt.png";
import OperatorMathop from "./selector-images/operators-images/operator_mathop.png";
import OperatorMod from "./selector-images/operators-images/operator_mod.png";
import OperatorNot from "./selector-images/operators-images/operator_not.png";
import OperatorOr from "./selector-images/operators-images/operator_or.png";
import OperatorRandom from "./selector-images/operators-images/operator_random.png";
import OperatorRound from "./selector-images/operators-images/operator_round.png";
import Variable_MyVariable from "./selector-images/variable-images/MyVariable.png"
import Variable_changeby from "./selector-images/variable-images/variable_changeby.png"
import Variable_hidevariable from "./selector-images/variable-images/variable_hidevariable.png"
import Variable_setto from "./selector-images/variable-images/variable_setto.png"
import Variable_showvariable from "./selector-images/variable-images/variable_showvariable.png"
import MyBlock_makeablock from "./selector-images/myblock-image/myblock_makeablock.png"




const SelectBlocks = ({ onClose, onUpdateBlocks, currentPreferences }) => {
    const initialSections = [
        {
            id: "motion",
            name: "Motion",
            subsections: [
                {
                    id: 1,
                    name: "motion_move_block",
                    imageUrl: MotionMoveBlock,
                },
                {
                    id: 2,
                    name: "motion_turn_right_block",
                    imageUrl: MotionTurnRight,
                },
                {
                    id: 3,
                    name: "motion_turn_left_block",
                    imageUrl: MotionTurnLeftBlock,
                },
                {
                    id: 4,
                    name: "motion_goto",
                    imageUrl: MotionGoto,
                },
                {
                    id: 5,
                    name: "motion_gotoxy",
                    imageUrl: MotionGoToxy,
                },
                {
                    id: 6,
                    name: "motion_glideto",
                    imageUrl: MotionGlideto,
                },
                {
                    id: 7,
                    name: "motion_glidesecstoxy",
                    imageUrl: MotionGlideSecsToxy,
                },
                {
                    id: 8,
                    name: "motion_pointindirection",
                    imageUrl: MotionPointDirection,
                },
                {
                    id: 9,
                    name: "motion_pointtowards",
                    imageUrl: MotionTowords,
                },
                {
                    id: 10,
                    name: "motion_changexby",
                    imageUrl: MotionChnagexby,
                },
                {
                    id: 11,
                    name: "motion_setx",
                    imageUrl: MotionsetXto,
                },
                {
                    id: 12,
                    name: "motion_changeyby",
                    imageUrl: MotionChnageyby,
                },
                {
                    id: 13,
                    name: "motion_sety",
                    imageUrl: MotionSetYto,
                },
                {
                    id: 14,
                    name: "motion_ifonedgebounce",
                    imageUrl: Motion_ifonEdgeBounce,
                },
                {
                    id: 15,
                    name: "motion_setrotationstyle",
                    imageUrl: Motion_setRotationStyle,
                },
                {
                    id: 16,
                    name: "motion_xyposition_direction",
                    imageUrl: Motion_xyPositonDirection,
                },
            ],
        },
        {
            id: "looks",
            name: "Looks",
            subsections: [
                {
                    id: 17,
                    name: "looks_sayforsecs",
                    imageUrl: looks_sayForSecs,
                },
                {
                    id: 18,
                    name: "looks_say",
                    imageUrl: looks_say,
                },
                {
                    id: 19,
                    name: "looks_thinkforsecs",
                    imageUrl: looks_thinkForsecs,
                },
                {
                    id: 20,
                    name: "looks_think",
                    imageUrl:looks_think,
                },
                {
                    id: 21,
                    name: "looks_switchbackdropto",
                    imageUrl:looks_switchBackdropto,
                },
                // {
                //     id: 22,
                //     name: "looks_switchbackdroptoandwait",
                //     imageUrl: "",
                // },
                {
                    id: 23,
                    name: "looks_nextbackdrop",
                    imageUrl: looks_nextBackdrop,
                },
                {
                    id: 24,
                    name: "looks_switchcostumeto",
                    imageUrl: looks_switchCostumeto,
                },
                {
                    id: 25,
                    name: "looks_nextcostume",
                    imageUrl: looks_nextCostume,
                },
                {
                    id: 26,
                    name: "looks_changesizeby",
                    imageUrl:looks_changeSizeby,
                },
                {
                    id: 27,
                    name: "looks_setsizeto",
                    imageUrl:looks_setSizeto,
                },
                {
                    id: 28,
                    name: "looks_changeeffectby",
                    imageUrl: looks_changeEffectby,
                },
                {
                    id: 29,
                    name: "looks_seteffectto",
                    imageUrl: looks_setEffectto,
                },
                {
                    id: 30,
                    name: "looks_cleargraphiceffects",
                    imageUrl: looks_clearGraphicEffects,
                },
                {
                    id: 31,
                    name: "looks_show_hide",
                    imageUrl:looks_show_hide,
                },
                {
                    id: 32,
                    name: "looks_gotofrontback",
                    imageUrl: looks_gotoFrontBack,
                },
                {
                    id: 33,
                    name: "looks_goforwardbackwardlayers",
                    imageUrl:looks_goForwardBackwardlayers,
                },
                // {
                //     id: 34,
                //     name: "looks_backdropnumbername",
                //     imageUrl: "",
                // },
                {
                    id: 35,
                    name: "looks_numbername_size",
                    imageUrl: looks_numberName_size,
                },
            ],
        },
        {
            id: "sound",
            name: "Sound",
            subsections: [
                {
                    id: 36,
                    name: "sound_playuntildone",
                    imageUrl: soundPlayUntilDone,
                },
                {
                    id: 37,
                    name: "sound_play",
                    imageUrl:soundPlay,
                },
                {
                    id: 38,
                    name: "sound_stopallsounds",
                    imageUrl:soundStopallSounds,
                },
                {
                    id: 39,
                    name: "sound_changeeffectby",
                    imageUrl: soundChangeEffectby,
                },
                {
                    id: 40,
                    name: "sound_seteffectto",
                    imageUrl: soundSetEffectto,
                },
                {
                    id: 41,
                    name: "sound_cleareffects",
                    imageUrl: soundClearEffect,
                },
                {
                    id: 42,
                    name: "sound_changevolumeby",
                    imageUrl:soundChangeVolumeby,
                },
                {
                    id: 43,
                    name: "sound_setvolumeto",
                    imageUrl: soundSetVolumeto,
                },
                {
                    id: 44,
                    name: "sound_volume",
                    imageUrl:soundVolume,
                },
            ],
        },
        {
            id: "event",
            name: "Event",
            subsections: [
                {
                    id: 45,
                    name: "event_whenflagclicked",
                    imageUrl: eventwhenFlagClicked,
                },
                {
                    id: 46,
                    name: "event_whenkeypressed",
                    imageUrl: eventwhenKeyPressed,
                },
                // {
                //     id: 47,
                //     name: "event_whenstageclicked",
                //     imageUrl: "",
                // },
                {
                    id: 48,
                    name: "event_whenthisspriteclicked",
                    imageUrl: eventwhenThisSpriteClicked,
                },
                {
                    id: 49,
                    name: "event_whenbackdropswitchesto",
                    imageUrl: eventwhenBackDropSwitchesto,
                },
                {
                    id: 50,
                    name: "event_whengreaterthan",
                    imageUrl: eventwhenGreaterthan,
                },
                {
                    id: 51,
                    name: "event_whenbroadcastreceived",
                    imageUrl:eventwhenBroadcastReceived,
                },
                {
                    id: 52,
                    name: "event_broadcast",
                    imageUrl: eventBroadcast,
                },
                {
                    id: 53,
                    name: "event_broadcastandwait",
                    imageUrl: eventbroadcastandwait,
                },
            ],
        },
        {
            id: "control",
            name: "Control",
            subsections: [
                {
                    id: 54,
                    name: "control_wait",
                    imageUrl: controlWait,
                },
                {
                    id: 55,
                    name: "control_repeat",
                    imageUrl: controlRepeat,
                },
                {
                    id: 56,
                    name: "control_forever",
                    imageUrl:controlForever,
                },
                {
                    id: 57,
                    name: "control_if",
                    imageUrl: controlif,
                },
                {
                    id: 58,
                    name: "control_if_else",
                    imageUrl: controlifelse,
                },
                {
                    id: 59,
                    name: "control_wait_until",
                    imageUrl: controlWaitUntil,
                },
                {
                    id: 60,
                    name: "control_repeat_until",
                    imageUrl: controlRepeatUntil,
                },
                {
                    id: 61,
                    name: "control_stop",
                    imageUrl: controlStop,
                },
                {
                    id: 62,
                    name: "control_create_clone_of",
                    imageUrl: controlCreateCloneof,
                },
                {
                    id: 63,
                    name: "control_start_as_clone",
                    imageUrl: controlStartasClone,
                },
                {
                    id: 64,
                    name: "control_delete_this_clone",
                    imageUrl: controlDeleteThisClone,
                },
            ],
        },
        {
            id: "sensing",
            name: "Sensing",
            subsections: [
                {
                    id: 65,
                    name: "sensing_touchingobject",
                    imageUrl: sensingTouchingobject,
                },
                {
                    id: 66,
                    name: "sensing_touchingcolor",
                    imageUrl: sensingTouchingcolor,
                },
                {
                    id: 67,
                    name: "sensing_coloristouchingcolor",
                    imageUrl: sensingColoristouchingcolor,
                },
                {
                    id: 68,
                    name: "sensing_distanceto",
                    imageUrl: sensingDistanceto,
                },
                {
                    id: 69,
                    name: "sensing_askandwait",
                    imageUrl: sensingAskandwait,
                },
                {
                    id: 70,
                    name: "sensing_answer",
                    imageUrl: sensingAnswer,
                },
                {
                    id: 71,
                    name: "sensing_keypressed",
                    imageUrl: sensingKeyPressed,
                },
                {
                    id: 72,
                    name: "sensing_mousedown",
                    imageUrl: sensingMousedown,
                },
                {
                    id: 73,
                    name: "sensing_mousex",
                    imageUrl:sensingMousex,
                },
                {
                    id: 74,
                    name: "sensing_mousey",
                    imageUrl: sensingMousey,
                },
                {
                    id: 75,
                    name: "sensing_setdragmode",
                    imageUrl: sensingSetdragmode,
                },
                {
                    id: 76,
                    name: "sensing_loudness",
                    imageUrl: sensingLoudness,
                },
                {
                    id: 77,
                    name: "sensing_timer",
                    imageUrl: sensingTimer,
                },
                {
                    id: 78,
                    name: "sensing_resettimer",
                    imageUrl: sensingResettimer,
                },
                {
                    id: 79,
                    name: "sensing_of",
                    imageUrl: sensingof,
                },
                {
                    id: 80,
                    name: "sensing_current",
                    imageUrl: sensingCurrent,
                },
                {
                    id: 81,
                    name: "sensing_dayssince2000",
                    imageUrl: sensingDayssince2000,
                },
                {
                    id: 82,
                    name: "sensing_username",
                    imageUrl: sensingUsername,
                },
            ],
        },
        {
            id: "operators",
            name: "Operators",
            subsections: [
                {
                    id: 83,
                    name: "operator_add",
                    imageUrl: OperatorAdd,
                },
                {
                    id: 84,
                    name: "operator_subtract",
                    imageUrl: OperatorSubtract,
                },
                {
                    id: 85,
                    name: "operator_multiply",
                    imageUrl: OperatorMultiply,
                },
                {
                    id: 86,
                    name: "operator_divide",
                    imageUrl: OperatorDivide,
                },
                {
                    id: 87,
                    name: "operator_random",
                    imageUrl: OperatorRandom,
                },
                {
                    id: 88,
                    name: "operator_gt",
                    imageUrl: Operatorgt,
                },
                {
                    id: 89,
                    name: "operator_lt",
                    imageUrl: Operatorlt,
                },
                {
                    id: 90,
                    name: "operator_equals",
                    imageUrl: OperatorEquals,
                },
                {
                    id: 91,
                    name: "operator_and",
                    imageUrl: OperatorAnd,
                },
                {
                    id: 92,
                    name: "operator_or",
                    imageUrl: OperatorOr,
                },
                {
                    id: 93,
                    name: "operator_not",
                    imageUrl: OperatorNot,
                },
                {
                    id: 94,
                    name: "operator_join",
                    imageUrl: OperatorJoin,
                },
                {
                    id: 95,
                    name: "operator_letter_of",
                    imageUrl:OperatorLetter_of,
                },
                {
                    id: 96,
                    name: "operator_length",
                    imageUrl:OperatorLength,
                },
                {
                    id: 97,
                    name: "operator_contains",
                    imageUrl: OperatorContains,
                },
                {
                    id: 98,
                    name: "operator_mod",
                    imageUrl:OperatorMod,
                },
                {
                    id: 99,
                    name: "operator_round",
                    imageUrl:OperatorRound,
                },
                {
                    id: 100,
                    name: "operator_mathop",
                    imageUrl: OperatorMathop,
                },
            ],
        },
        {
            id: "variables",
            name: "Variables",
            subsections: [
                {
                    id: 101,
                    name: "variables_myvariable",
                    imageUrl: Variable_MyVariable,
                },
                {
                    id: 102,
                    name: "variables_setto",
                    imageUrl:Variable_setto,
                },
                {
                    id: 103,
                    name: "variables_changeby",
                    imageUrl: Variable_changeby,
                },
                {
                    id: 104,
                    name: "variables_showvariable",
                    imageUrl: Variable_showvariable,
                },
                {
                    id: 105,
                    name: "variables_hidevariable",
                    imageUrl: Variable_hidevariable,
                },
            ],
        },
        {
            id: "myblocks",
            name: "MyBlocks",
            subsections: [
                {
                    id: 106,
                    name: "myblocks_makeablock",
                    imageUrl: MyBlock_makeablock,
                }
            ]
        }
    ];

    // Initialize selectedItems based on current preferences from the store
    const [selectedItems, setSelectedItems] = useState({});
    const [showMotionCategory, setShowMotionCategory] = useState(true);
    const [showLooksCategory, setShowLooksCategory] = useState(true);
    const [showSoundCategory, setShowSoundCategory] = useState(true);
    const [showEventCategory, setShowEventCategory] = useState(true);
    const [showControlCategory, setShowControlCategory] = useState(true);
    const [showSensingCategory, setShowSensingCategory] = useState(true);
    const [showOperatorsCategory, setShowOperatorsCategory] = useState(true);
    const [showVariablesCategory, setShowVariablesCategory] = useState(true);
    const [showMyblockCategory, setShowMyblocksCategory] = useState(true);

    // Helper function to check if any motion block is selected

    const checkBlocksStatus = (category, items) => {
        const blocks = {
            motion: [
                "motion_move_block",
                "motion_turn_right_block",
                "motion_turn_left_block",
                "motion_goto",
                "motion_gotoxy",
                "motion_glideto",
                "motion_glidesecstoxy",
                "motion_pointindirection",
                "motion_pointtowards",
                "motion_changexby",
                "motion_setx",
                "motion_changeyby",
                "motion_sety",
                "motion_ifonedgebounce",
                "motion_setrotationstyle",
                "motion_xyposition_direction",
            ],
            looks: [
                "looks_sayforsecs",
                "looks_say",
                "looks_thinkforsecs",
                "looks_think",
                "looks_switchbackdropto",
                "looks_switchbackdroptoandwait",
                "looks_nextbackdrop",
                "looks_switchcostumeto",
                "looks_nextcostume",
                "looks_changesizeby",
                "looks_setsizeto",
                "looks_changeeffectby",
                "looks_seteffectto",
                "looks_cleargraphiceffects",
                "looks_show_hide",
                "looks_gotofrontback",
                "looks_goforwardbackwardlayers",
                "looks_backdropnumbername",
                "looks_numbername_size",
            ],
            sound: [
                "sound_playuntildone",
                "sound_play",
                "sound_stopallsounds",
                "sound_changeeffectby",
                "sound_seteffectto",
                "sound_cleareffects",
                "sound_changevolumeby",
                "sound_setvolumeto",
                "sound_volume",
            ],
            event: [
                "event_whenflagclicked",
                "event_whenkeypressed",
                "event_whenstageclicked",
                "event_whenthisspriteclicked",
                "event_whenbackdropswitchesto",
                "event_whengreaterthan",
                "event_whenbroadcastreceived",
                "event_broadcast",
                "event_broadcastandwait",
            ],
            control: [
                "control_wait",
                "control_repeat",
                "control_forever",
                "control_if",
                "control_if_else",
                "control_wait_until",
                "control_repeat_until",
                "control_stop",
                "control_create_clone_of",
                "control_start_as_clone",
                "control_delete_this_clone",
            ],
            sensing: [
                "sensing_touchingobject",
                "sensing_touchingcolor",
                "sensing_coloristouchingcolor",
                "sensing_distanceto",
                "sensing_askandwait",
                "sensing_answer",
                "sensing_keypressed",
                "sensing_mousedown",
                "sensing_mousex",
                "sensing_mousey",
                "sensing_setdragmode",
                "sensing_loudness",
                "sensing_timer",
                "sensing_resettimer",
                "sensing_of",
                "sensing_current",
                "sensing_dayssince2000",
                "sensing_username",
            ],
            operators: [
                "operator_add",
                "operator_subtract",
                "operator_multiply",
                "operator_divide",
                "operator_random",
                "operator_gt",
                "operator_lt",
                "operator_equals",
                "operator_and",
                "operator_or",
                "operator_not",
                "operator_join",
                "operator_letter_of",
                "operator_length",
                "operator_contains",
                "operator_mod",
                "operator_round",
                "operator_mathop",
            ],
            variables: [
                "variables_myvariable",
                "variables_setto",
                "variables_changeby",
                "variables_showvariable",
                "variables_hidevariable",
            ],
            myblocks: [
                "myblocks_makeablock",
            ],
        };
        return blocks[category].some((block) => items[block]);
    };

    useEffect(() => {
        if (currentPreferences) {
            const initialItems = {
                ...currentPreferences.motion,
                ...currentPreferences.looks,
                ...currentPreferences.sound,
                ...currentPreferences.event,
                ...currentPreferences.control,
                ...currentPreferences.sensing,
                ...currentPreferences.operators,
                ...currentPreferences.variables,
                ...currentPreferences.myblocks,
            };
            setSelectedItems(initialItems);

            setShowMotionCategory(checkBlocksStatus("motion", initialItems));
            setShowLooksCategory(checkBlocksStatus("looks", initialItems));
            setShowSoundCategory(checkBlocksStatus("sound", initialItems));
            setShowEventCategory(checkBlocksStatus("event", initialItems));
            setShowControlCategory(checkBlocksStatus("control", initialItems));
            setShowSensingCategory(checkBlocksStatus("sensing", initialItems));
            setShowOperatorsCategory(
                checkBlocksStatus("operators", initialItems)
            );
            setShowVariablesCategory(
                checkBlocksStatus("variables", initialItems)
            );
            setShowMyblocksCategory(checkBlocksStatus("myblocks", initialItems));
        }
    }, [currentPreferences]);

    const handleCheckboxChange = (name) => {
        const updatedItems = {
            ...selectedItems,
            [name]: !selectedItems[name],
        };
        setSelectedItems(updatedItems);
        setShowMotionCategory(checkBlocksStatus("motion", updatedItems));
        setShowLooksCategory(checkBlocksStatus("looks", updatedItems));
        setShowSoundCategory(checkBlocksStatus("sound", updatedItems));
        setShowEventCategory(checkBlocksStatus("event", updatedItems));
        setShowControlCategory(checkBlocksStatus("control", updatedItems));
        setShowSensingCategory(checkBlocksStatus("sensing", updatedItems));
        setShowOperatorsCategory(checkBlocksStatus("operators", updatedItems));
        setShowVariablesCategory(checkBlocksStatus("variables", updatedItems));
        setShowMyblocksCategory(checkBlocksStatus("myblocks", updatedItems));
    };
    const handleSectionChange = (sectionId, subsections) => {
        const allSelected = subsections.every(
            (subsection) => selectedItems[subsection.name]
        );

        const updatedItems = {
            ...selectedItems,
            ...subsections.reduce((acc, subsection) => {
                acc[subsection.name] = !allSelected;
                return acc;
            }, {}),
        };

        setSelectedItems(updatedItems);
        setShowMotionCategory(checkBlocksStatus("motion", updatedItems));
        setShowLooksCategory(checkBlocksStatus("looks", updatedItems));
        setShowSoundCategory(checkBlocksStatus("sound", updatedItems));
        setShowEventCategory(checkBlocksStatus("event", updatedItems));
        setShowControlCategory(checkBlocksStatus("control", updatedItems));
        setShowSensingCategory(checkBlocksStatus("sensing", updatedItems));
        setShowOperatorsCategory(checkBlocksStatus("operators", updatedItems));
        setShowVariablesCategory(checkBlocksStatus("variables", updatedItems));
        setShowMyblocksCategory(checkBlocksStatus("myblocks", updatedItems));
    };

    const saveChanges = () => {
        // Log the current preferences before updating
        // console.log("Current Preferences Before Update:", currentPreferences);
        const updatedPreferences = {
            motion: {
                // Create preferences for all blocks, defaulting to false for unselected ones
                showMotionCategory: showMotionCategory,
                motion_move_block:
                    !!selectedItems["motion_move_block"] || false,
                motion_turn_right_block:
                    !!selectedItems["motion_turn_right_block"] || false,
                motion_turn_left_block:
                    !!selectedItems["motion_turn_left_block"] || false,
                motion_goto: !!selectedItems["motion_goto"] || false,
                motion_gotoxy: !!selectedItems["motion_gotoxy"] || false,
                motion_glideto: !!selectedItems["motion_glideto"] || false,
                motion_glidesecstoxy:
                    !!selectedItems["motion_glidesecstoxy"] || false,
                motion_pointindirection:
                    !!selectedItems["motion_pointindirection"] || false,
                motion_pointtowards:
                    !!selectedItems["motion_pointtowards"] || false,
                motion_changexby: !!selectedItems["motion_changexby"] || false,
                motion_setx: !!selectedItems["motion_setx"] || false,
                motion_changeyby: !!selectedItems["motion_changeyby"] || false,
                motion_sety: !!selectedItems["motion_sety"] || false,
                motion_ifonedgebounce:
                    !!selectedItems["motion_ifonedgebounce"] || false,
                motion_setrotationstyle:
                    !!selectedItems["motion_setrotationstyle"] || false,
                motion_xyposition_direction:
                    !!selectedItems["motion_xyposition_direction"] || false,
            },
            looks: {
                showlooksCategory: showLooksCategory,
                looks_sayforsecs: !!selectedItems["looks_sayforsecs"] || false,
                looks_say: !!selectedItems["looks_say"] || false,
                looks_thinkforsecs:
                    !!selectedItems["looks_thinkforsecs"] || false,
                looks_think: !!selectedItems["looks_think"] || false,
                looks_switchbackdropto:
                    !!selectedItems["looks_switchbackdropto"] || false,
                looks_switchbackdroptoandwait:
                    !!selectedItems["looks_switchbackdroptoandwait"] || false,
                looks_nextbackdrop:
                    !!selectedItems["looks_nextbackdrop"] || false,
                looks_switchcostumeto:
                    !!selectedItems["looks_switchcostumeto"] || false,
                looks_nextcostume:
                    !!selectedItems["looks_nextcostume"] || false,
                looks_changesizeby:
                    !!selectedItems["looks_changesizeby"] || false,
                looks_setsizeto: !!selectedItems["looks_setsizeto"] || false,
                looks_changeeffectby:
                    !!selectedItems["looks_changeeffectby"] || false,
                looks_seteffectto:
                    !!selectedItems["looks_seteffectto"] || false,
                looks_cleargraphiceffects:
                    !!selectedItems["looks_cleargraphiceffects"] || false,
                looks_show_hide: !!selectedItems["looks_show_hide"] || false,
                looks_gotofrontback:
                    !!selectedItems["looks_gotofrontback"] || false,
                looks_goforwardbackwardlayers:
                    !!selectedItems["looks_goforwardbackwardlayers"] || false,
                looks_backdropnumbername:
                    !!selectedItems["looks_backdropnumbername"] || false,
                looks_numbername_size:
                    !!selectedItems["looks_numbername_size"] || false,
            },
            sound: {
                showsoundCategory: showSoundCategory,
                sound_playuntildone:
                    !!selectedItems["sound_playuntildone"] || false,
                sound_play: !!selectedItems["sound_play"] || false,
                sound_stopallsounds:
                    !!selectedItems["sound_stopallsounds"] || false,
                sound_changeeffectby:
                    !!selectedItems["sound_changeeffectby"] || false,
                sound_seteffectto:
                    !!selectedItems["sound_seteffectto"] || false,
                sound_cleareffects:
                    !!selectedItems["sound_cleareffects"] || false,
                sound_changevolumeby:
                    !!selectedItems["sound_changevolumeby"] || false,
                sound_setvolumeto:
                    !!selectedItems["sound_setvolumeto"] || false,
                sound_volume: !!selectedItems["sound_volume"] || false,
            },
            event: {
                showeventCategory: showEventCategory,
                event_whenflagclicked:
                    !!selectedItems["event_whenflagclicked"] || false,
                event_whenkeypressed:
                    !!selectedItems["event_whenkeypressed"] || false,
                event_whenstageclicked:
                    !!selectedItems["event_whenstageclicked"] || false,
                event_whenthisspriteclicked:
                    !!selectedItems["event_whenthisspriteclicked"] || false,
                event_whenbackdropswitchesto:
                    !!selectedItems["event_whenbackdropswitchesto"] || false,
                event_whengreaterthan:
                    !!selectedItems["event_whengreaterthan"] || false,
                event_whenbroadcastreceived:
                    !!selectedItems["event_whenbroadcastreceived"] || false,
                event_broadcast: !!selectedItems["event_broadcast"] || false,
                event_broadcastandwait:
                    !!selectedItems["event_broadcastandwait"] || false,
            },
            control: {
                showcontrolCategory: showControlCategory,
                control_wait: !!selectedItems["control_wait"] || false,
                control_repeat: !!selectedItems["control_repeat"] || false,
                control_forever: !!selectedItems["control_forever"] || false,
                control_if: !!selectedItems["control_if"] || false,
                control_if_else: !!selectedItems["control_if_else"] || false,
                control_wait_until:
                    !!selectedItems["control_wait_until"] || false,
                control_repeat_until:
                    !!selectedItems["control_repeat_until"] || false,
                control_stop: !!selectedItems["control_stop"] || false,
                control_create_clone_of:
                    !!selectedItems["control_create_clone_of"] || false,
                control_start_as_clone:
                    !!selectedItems["control_start_as_clone"] || false,
                control_delete_this_clone:
                    !!selectedItems["control_delete_this_clone"] || false,
            },
            sensing: {
                showsensingCategory: showSensingCategory,
                sensing_touchingobject:
                    !!selectedItems["sensing_touchingobject"] || false,
                sensing_touchingcolor:
                    !!selectedItems["sensing_touchingcolor"] || false,
                sensing_coloristouchingcolor:
                    !!selectedItems["sensing_coloristouchingcolor"] || false,
                sensing_distanceto:
                    !!selectedItems["sensing_distanceto"] || false,
                sensing_askandwait:
                    !!selectedItems["sensing_askandwait"] || false,
                sensing_answer: !!selectedItems["sensing_answer"] || false,
                sensing_keypressed:
                    !!selectedItems["sensing_keypressed"] || false,
                sensing_mousedown:
                    !!selectedItems["sensing_mousedown"] || false,
                sensing_mousex: !!selectedItems["sensing_mousex"] || false,
                sensing_mousey: !!selectedItems["sensing_mousey"] || false,
                sensing_setdragmode:
                    !!selectedItems["sensing_setdragmode"] || false,
                sensing_loudness: !!selectedItems["sensing_loudness"] || false,
                sensing_timer: !!selectedItems["sensing_timer"] || false,
                sensing_resettimer:
                    !!selectedItems["sensing_resettimer"] || false,
                sensing_of: !!selectedItems["sensing_of"] || false,
                sensing_current: !!selectedItems["sensing_current"] || false,
                sensing_dayssince2000:
                    !!selectedItems["sensing_dayssince2000"] || false,
                sensing_username: !!selectedItems["sensing_username"] || false,
            },
            operators: {
                showoperatorsCategory: showOperatorsCategory,
                operator_add: !!selectedItems["operator_add"] || false,
                operator_subtract:
                    !!selectedItems["operator_subtract"] || false,
                operator_multiply:
                    !!selectedItems["operator_multiply"] || false,
                operator_divide: !!selectedItems["operator_divide"] || false,
                operator_random: !!selectedItems["operator_random"] || false,
                operator_gt: !!selectedItems["operator_gt"] || false,
                operator_lt: !!selectedItems["operator_lt"] || false,
                operator_equals: !!selectedItems["operator_equals"] || false,
                operator_and: !!selectedItems["operator_and"] || false,
                operator_or: !!selectedItems["operator_or"] || false,
                operator_not: !!selectedItems["operator_not"] || false,
                operator_join: !!selectedItems["operator_join"] || false,
                operator_letter_of:
                    !!selectedItems["operator_letter_of"] || false,
                operator_length: !!selectedItems["operator_length"] || false,
                operator_contains:
                    !!selectedItems["operator_contains"] || false,
                operator_mod: !!selectedItems["operator_mod"] || false,
                operator_round: !!selectedItems["operator_round"] || false,
                operator_mathop: !!selectedItems["operator_mathop"] || false,
            },
            variables: {
                showvariablesCategory: showVariablesCategory,
                variables_myvariable:
                    !!selectedItems["variables_myvariable"] || false,
                variables_setto: !!selectedItems["variables_setto"] || false,
                variables_changeby:
                    !!selectedItems["variables_changeby"] || false,
                variables_showvariable:
                    !!selectedItems["variables_showvariable"] || false,
                variables_hidevariable:
                    !!selectedItems["variables_hidevariable"] || false,
            },
            myblocks:{
                showmyblocksCategory:showMyblockCategory,
                myblocks_makeablock:  !!selectedItems["myblocks_makeablock"] || false,
            }
        };

        // console.log("Updated Preferences:", updatedPreferences); // Log the preferences to check
        onUpdateBlocks(updatedPreferences); // Dispatch the action
        // console.log("Dispatching updateBlocks action"); // Log before dispatching
        onClose();
    };
        
    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h2>Select Your Blocks</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.selectTable}>
                        <thead>
                            <tr>
                                <th>Blocks</th>
                                <th>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialSections.map((section) => (
                                <React.Fragment key={section.id}>
                                    <tr>
                                        <td
                                            colSpan="2"
                                            className={styles.sectionRow}
                                        >
                                            <strong>{section.name}</strong>
                                            <input
                                                type="checkbox"
                                                checked={section.subsections.every(
                                                    (sub) =>
                                                        selectedItems[sub.name]
                                                )}
                                                onChange={() =>
                                                    handleSectionChange(
                                                        section.id,
                                                        section.subsections
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>

                                    {section.subsections.map((subsection) => (
                                        <tr key={subsection.id}>
                                            <td>
                                                <img
                                                    src={subsection.imageUrl}
                                                    alt={subsection.name}
                                                    className={styles.image}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!selectedItems[
                                                            subsection.name
                                                        ]
                                                    }
                                                    onChange={() =>
                                                        handleCheckboxChange(
                                                            subsection.name
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={saveChanges} className={styles.saveButton}>
                    Update Blocks
                </button>
                <button onClick={onClose} className={styles.closeButton}>
                    Close
                </button>
            </div>
        </div>
    );
};

// Prop Types for validation
SelectBlocks.propTypes = {
    onClose: PropTypes.func.isRequired, 
    onUpdateBlocks: PropTypes.func.isRequired, // Add this line for the new prop
    currentPreferences: PropTypes.shape({
        motion: PropTypes.shape({
            showMotionCategory: PropTypes.bool,
            motion_move_block: PropTypes.bool,
            motion_turn_right_block: PropTypes.bool,
            motion_turn_left_block: PropTypes.bool,
            motion_goto: PropTypes.bool,
            motion_gotoxy: PropTypes.bool,
            motion_glideto: PropTypes.bool,
            motion_glidesecstoxy: PropTypes.bool,
            motion_pointindirection: PropTypes.bool,
            motion_pointtowards: PropTypes.bool,
            motion_changexby: PropTypes.bool,
            motion_setx: PropTypes.bool,
            motion_changeyby: PropTypes.bool,
            motion_sety: PropTypes.bool,
            motion_ifonedgebounce: PropTypes.bool,
            motion_setrotationstyle: PropTypes.bool,
            motion_xyposition_direction: PropTypes.bool,
            isMotionDisabled: PropTypes.bool,
        }),
        looks: PropTypes.shape({
            showlooksCategory: PropTypes.bool,
            looks_sayforsecs: PropTypes.bool,
            looks_say: PropTypes.bool,
            looks_thinkforsecs: PropTypes.bool,
            looks_think: PropTypes.bool,
            looks_switchbackdropto: PropTypes.bool,
            looks_switchbackdroptoandwait: PropTypes.bool,
            looks_nextbackdrop: PropTypes.bool,
            looks_switchcostumeto: PropTypes.bool,
            looks_nextcostume: PropTypes.bool,
            looks_changesizeby: PropTypes.bool,
            looks_setsizeto: PropTypes.bool,
            looks_changeeffectby: PropTypes.bool,
            looks_seteffectto: PropTypes.bool,
            looks_cleargraphiceffects: PropTypes.bool,
            looks_show_hide: PropTypes.bool,
            looks_gotofrontback: PropTypes.bool,
            looks_goforwardbackwardlayers: PropTypes.bool,
            looks_backdropnumbername: PropTypes.bool,
            looks_numbername_size: PropTypes.bool,
        }),
        sound: PropTypes.shape({
            showsoundCategory: PropTypes.bool,
            sound_playuntildone: PropTypes.bool,
            sound_play: PropTypes.bool,
            sound_stopallsounds: PropTypes.bool,
            sound_changeeffectby: PropTypes.bool,
            sound_seteffectto: PropTypes.bool,
            sound_cleareffects: PropTypes.bool,
            sound_changevolumeby: PropTypes.bool,
            sound_setvolumeto: PropTypes.bool,
            sound_volume: PropTypes.bool,
        }),
        event: PropTypes.shape({
            showeventCategory: PropTypes.bool,
            event_whenflagclicked: PropTypes.bool,
            event_whenkeypressed: PropTypes.bool,
            event_whenstageclicked: PropTypes.bool,
            event_whenthisspriteclicked: PropTypes.bool,
            event_whenbackdropswitchesto: PropTypes.bool,
            event_whengreaterthan: PropTypes.bool,
            event_whenbroadcastreceived: PropTypes.bool,
            event_broadcast: PropTypes.bool,
            event_broadcastandwait: PropTypes.bool,
        }),
        control: PropTypes.shape({
            showcontrolCategory: PropTypes.bool,
            control_wait: PropTypes.bool,
            control_repeat: PropTypes.bool,
            control_forever: PropTypes.bool,
            control_if: PropTypes.bool,
            control_if_else: PropTypes.bool,
            control_wait_until: PropTypes.bool,
            control_repeat_until: PropTypes.bool,
            control_stop: PropTypes.bool,
            control_create_clone_of: PropTypes.bool,
            control_start_as_clone: PropTypes.bool,
            control_delete_this_clone: PropTypes.bool,
        }),
        sensing: PropTypes.shape({
            showsensingCategory: PropTypes.bool,
            sensing_touchingobject: PropTypes.bool,
            sensing_touchingcolor: PropTypes.bool,
            sensing_coloristouchingcolor: PropTypes.bool,
            sensing_distanceto: PropTypes.bool,
            sensing_askandwait: PropTypes.bool,
            sensing_answer: PropTypes.bool,
            sensing_keypressed: PropTypes.bool,
            sensing_mousedown: PropTypes.bool,
            sensing_mousex: PropTypes.bool,
            sensing_mousey: PropTypes.bool,
            sensing_setdragmode: PropTypes.bool,
            sensing_loudness: PropTypes.bool,
            sensing_timer: PropTypes.bool,
            sensing_resettimer: PropTypes.bool,
            sensing_of: PropTypes.bool,
            sensing_current: PropTypes.bool,
            sensing_dayssince2000: PropTypes.bool,
            sensing_username: PropTypes.bool,
        }),
        operators: PropTypes.shape({
            showoperatorsCategory: PropTypes.bool,
            operator_add: PropTypes.bool,
            operator_subtract: PropTypes.bool,
            operator_multiply: PropTypes.bool,
            operator_divide: PropTypes.bool,
            operator_random: PropTypes.bool,
            operator_gt: PropTypes.bool,
            operator_lt: PropTypes.bool,
            operator_equals: PropTypes.bool,
            operator_and: PropTypes.bool,
            operator_or: PropTypes.bool,
            operator_not: PropTypes.bool,
            operator_join: PropTypes.bool,
            operator_letter_of: PropTypes.bool,
            operator_length: PropTypes.bool,
            operator_contains: PropTypes.bool,
            operator_mod: PropTypes.bool,
            operator_round: PropTypes.bool,
            operator_mathop: PropTypes.bool,
        }),
        variables: PropTypes.shape({
            showvariablesCategory: PropTypes.bool,
            variables_myvariable: PropTypes.bool,
            variables_setto: PropTypes.bool,
            variables_changeby: PropTypes.bool,
            variables_showvariable: PropTypes.bool,
            variables_hidevariable: PropTypes.bool,
        }),
        myblocks: PropTypes.shape({
            showmyblocksCategory:PropTypes.bool,
            myblocks_makeablock:PropTypes.bool,
        })
    }).isRequired,
};

// Map state to props
const mapStateToProps = (state) => {
    // console.log("Mapped state to propshhhh:", state);
    return {
        currentPreferences: state.scratchGui.selectBlocks, // Accessing selectBlocks directly
    };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch) => ({
    onUpdateBlocks: (preferences) => {
        // console.log("Dispatching updateBlocks with preferences:", preferences); // Log preferences
        dispatch(updateBlocks(preferences)); // Dispatch the updateBlocks action
    },
});

// Connect the component to Redux
export default connect(mapStateToProps, mapDispatchToProps)(SelectBlocks);

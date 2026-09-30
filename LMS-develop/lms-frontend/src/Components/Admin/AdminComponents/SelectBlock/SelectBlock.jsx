import React, {useState,useEffect} from "react";
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
import looks_switchbackdroptoandwait from "./selector-images/looks-images/looks_switchbackdroptoandwait.png";
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
import event_whenstageclicked from './selector-images/events-images/event_whenstageclicked.png'
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
import Variable_MyVariable from "./selector-images/variable-images/MyVariable.png";
import Variable_changeby from "./selector-images/variable-images/variable_changeby.png";
import Variable_hidevariable from "./selector-images/variable-images/variable_hidevariable.png";
import Variable_setto from "./selector-images/variable-images/variable_setto.png";
import Variable_showvariable from "./selector-images/variable-images/variable_showvariable.png";
import MyBlock_makeablock from "./selector-images/myblock-image/myblock_makeablock.png";
import "./SelectBlocks.css";

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
                imageUrl: looks_think,
            },
            {
                id: 21,
                name: "looks_switchbackdropto",
                imageUrl: looks_switchBackdropto,
            },
            {
                id: 22,
                name: "looks_switchbackdroptoandwait",
                imageUrl: looks_switchbackdroptoandwait,
            },
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
                imageUrl: looks_changeSizeby,
            },
            {
                id: 27,
                name: "looks_setsizeto",
                imageUrl: looks_setSizeto,
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
                imageUrl: looks_show_hide,
            },
            {
                id: 32,
                name: "looks_gotofrontback",
                imageUrl: looks_gotoFrontBack,
            },
            {
                id: 33,
                name: "looks_goforwardbackwardlayers",
                imageUrl: looks_goForwardBackwardlayers,
            },
            {
                id: 34,
                name: "looks_backdropnumbername",
                imageUrl: looksBackDropNumberName,
            },
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
                imageUrl: soundPlay,
            },
            {
                id: 38,
                name: "sound_stopallsounds",
                imageUrl: soundStopallSounds,
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
                imageUrl: soundChangeVolumeby,
            },
            {
                id: 43,
                name: "sound_setvolumeto",
                imageUrl: soundSetVolumeto,
            },
            {
                id: 44,
                name: "sound_volume",
                imageUrl: soundVolume,
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
            {
                id: 47,
                name: "event_whenstageclicked",
                imageUrl: event_whenstageclicked,
            },
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
                imageUrl: eventwhenBroadcastReceived,
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
                imageUrl: controlForever,
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
                imageUrl: sensingMousex,
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
                imageUrl: OperatorLetter_of,
            },
            {
                id: 96,
                name: "operator_length",
                imageUrl: OperatorLength,
            },
            {
                id: 97,
                name: "operator_contains",
                imageUrl: OperatorContains,
            },
            {
                id: 98,
                name: "operator_mod",
                imageUrl: OperatorMod,
            },
            {
                id: 99,
                name: "operator_round",
                imageUrl: OperatorRound,
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
                imageUrl: Variable_setto,
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
            },
        ],
    },
];

const SelectBlock = ({ onClose, onUpdateBlocks }) => {
    // State to track selected individual blocks
    const [selectedItems, setSelectedItems] = useState({});

    // State to track selected categories (independent from individual blocks)
    const [selectedCategories, setSelectedCategories] = useState({});

    // Handle individual checkbox change
    const handleCheckboxChange = (name) => {
        setSelectedItems((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    // Handle category checkbox change (select/deselect all items in category)
    const handleCategoryChange = (sectionId, subsections) => {
        // Toggle the category selection state
        const newCategoryValue = !selectedCategories[sectionId];

        // Update category selection state
        setSelectedCategories((prev) => ({
            ...prev,
            [sectionId]: newCategoryValue,
        }));

        // Select/deselect all blocks in this category based on the new category state
        const newSelectedItems = { ...selectedItems };
        subsections.forEach((subsection) => {
            newSelectedItems[subsection.name] = newCategoryValue;
        });

        setSelectedItems(newSelectedItems);
    };

    // Format the selected items into the expected structure for the backend
    const formatSelectedBlocks = () => {
        const result = [];

        initialSections.forEach((section) => {
            const blockCategory = section.id;
            const subSelectedBlock = [];

            // Get the correct category visibility name based on section ID
            let categoryVisibilityName;
            switch (section.id) {
                case "motion":
                    categoryVisibilityName = "showMotionCategory";
                    break;
                case "looks":
                    categoryVisibilityName = "showlooksCategory"; // lowercase 'l'
                    break;
                case "sound":
                    categoryVisibilityName = "showsoundCategory";
                    break;
                case "event":
                    categoryVisibilityName = "showeventCategory";
                    break;
                case "control":
                    categoryVisibilityName = "showcontrolCategory";
                    break;
                case "sensing":
                    categoryVisibilityName = "showsensingCategory";
                    break;
                case "operators":
                    categoryVisibilityName = "showoperatorsCategory";
                    break;
                case "variables":
                    categoryVisibilityName = "showvariablesCategory";
                    break;
                case "myblocks":
                    categoryVisibilityName = "showmyblocksCategory";
                    break;
                default:
                    categoryVisibilityName = `show${section.id}Category`;
            }

            // Add the category visibility control as the first item
            // Use the independent category selection state
            subSelectedBlock.push({
                subBlockName: categoryVisibilityName,
                value: selectedCategories[section.id] || false,
            });

            // Add all individual blocks from this section
            section.subsections.forEach((subsection) => {
                subSelectedBlock.push({
                    subBlockName: subsection.name,
                    value: selectedItems[subsection.name] || false,
                });
            });

            // Always include the category in results, even if no blocks are selected
            result.push({
                blockCategory,
                subSelectedBlock,
            });
        });

        return result;
    };

    // Save and close the popup
    const saveChanges = () => {
        const updatedPreferences = formatSelectedBlocks();
        onUpdateBlocks(updatedPreferences);
        onClose();
    };

    return (
        <div className="overlay" style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "100px" }}>
            <div className="popup" style={{ width: "70%", maxWidth: "900px", height: "auto", transform: "scale(1)", transformOrigin: "center", maxHeight: "80vh", overflow: "hidden" }}>
                <h2 style={{ fontSize: "22px", margin: "15px 0" }}>Select Your Blocks</h2>
                <div className="tableContainer" style={{ maxHeight: "60vh", overflowY: "auto", width: "100%" }}>
                    <table className="selectTable" style={{ width: "100%", borderSpacing: "0 10px", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th style={{ fontSize: "18px", padding: "12px", width: "80%" }}>Blocks</th>
                                <th style={{ fontSize: "18px", padding: "12px", width: "20%" }}>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialSections.map((section) => (
                                <React.Fragment key={section.id}>
                                    <tr>
                                        <td colSpan="2" className="sectionRow" style={{ padding: "15px", fontSize: "20px" }}>
                                            <strong>{section.name}</strong>
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories[section.id] || false}
                                                onChange={() => handleCategoryChange(section.id, section.subsections)}
                                                style={{ width: "24px", height: "24px", marginLeft: "15px" }}
                                            />
                                        </td>
                                    </tr>
    
                                    {section.subsections.map((subsection) => (
                                        <tr key={subsection.id}>
                                            <td style={{ padding: "12px" }}>
                                                <img
                                                    src={subsection.imageUrl || "/placeholder.svg"}
                                                    alt={subsection.name}
                                                    className="image"
                                                    style={{ width: "120px", height: "120px", objectFit: "contain" }}
                                                />
                                                {/* <span style={{ marginLeft: "15px", fontSize: "18px" }}>{subsection.name}</span> */}
                                            </td>
                                            <td style={{ padding: "15px", textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems[subsection.name] || false}
                                                    onChange={() => handleCheckboxChange(subsection.name)}
                                                    style={{ width: "24px", height: "24px" }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ margin: "20px 0", display: "flex", justifyContent: "center", gap: "15px" }}>
                    <button 
                        onClick={saveChanges} 
                        className="saveButton"
                        style={{ padding: "10px 20px", fontSize: "16px", borderRadius: "6px", cursor: "pointer" }}
                    >
                        Update Blocks
                    </button>
                    <button 
                        onClick={onClose} 
                        className="closeButton"
                        style={{ padding: "10px 20px", fontSize: "16px", borderRadius: "6px", cursor: "pointer" }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectBlock;

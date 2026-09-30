import ScratchBlocks from "scratch-blocks";

import { defaultColors } from "./themes";

const categorySeparator = '<sep gap="36"/>';

const blockSeparator = '<sep gap="36"/>'; // At default scale, about 28px

/* eslint-disable no-unused-vars */
const motion = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    motion_move_block,
    motion_turn_right_block,
    motion_turn_left_block,
    motion_goto,
    motion_gotoxy,
    motion_glideto,
    motion_glidesecstoxy,
    motion_pointindirection,
    motion_pointtowards,
    motion_changexby,
    motion_setx,
    motion_changeyby,
    motion_sety,
    motion_ifonedgebounce,
    motion_setrotationstyle,
    motion_xyposition_direction,
    showMotionCategory
) {

    if (!showMotionCategory) return '';

    const stageSelected = ScratchBlocks.ScratchMsgs.translate(
        "MOTION_STAGE_SELECTED",
        "Stage selected: no motion blocks"
    );
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category name="%{BKY_CATEGORY_MOTION}" id="motion" colour="${colors.primary
        }" secondaryColour="${colors.tertiary}">
        ${isStage
            ? `<label text="${stageSelected}"></label>`
            : `
         ${motion_move_block ? `
            <block type="motion_movesteps">
                <value name="STEPS">
                    <shadow type="math_number">
                        <field name="NUM">10</field>
                    </shadow>
                </value>
            </block>
        ` : ''}
        ${motion_turn_right_block ? `
        <block type="motion_turnright">
            <value name="DEGREES">
                <shadow type="math_number">
                    <field name="NUM">15</field>
                </shadow>
            </value>
        </block>
        ` : ''}
        ${motion_turn_left_block ? `
        <block type="motion_turnleft">
            <value name="DEGREES">
                <shadow type="math_number">
                    <field name="NUM">15</field>
                </shadow>
            </value>
        </block> 
        ` : ''}

        ${blockSeparator}

        ${motion_goto ? `
        <block type="motion_goto">
            <value name="TO">
                <shadow type="motion_goto_menu">
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_gotoxy ? `
        <block type="motion_gotoxy">
            <value name="X">
                <shadow id="movex" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
            <value name="Y">
                <shadow id="movey" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_glideto ? `
        <block type="motion_glideto" id="motion_glideto">
            <value name="SECS">
                <shadow type="math_number">
                    <field name="NUM">1</field>
                </shadow>
            </value>
            <value name="TO">
                <shadow type="motion_glideto_menu">
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_glidesecstoxy ? `
        <block type="motion_glidesecstoxy">
            <value name="SECS">
                <shadow type="math_number">
                    <field name="NUM">1</field>
                </shadow>
            </value>
            <value name="X">
                <shadow id="glidex" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
            <value name="Y">
                <shadow id="glidey" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${blockSeparator}
        
        ${motion_pointindirection ? `
        <block type="motion_pointindirection">
            <value name="DIRECTION">
                <shadow type="math_angle">
                    <field name="NUM">90</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_pointtowards ? `
        <block type="motion_pointtowards">
            <value name="TOWARDS">
                <shadow type="motion_pointtowards_menu">
                </shadow>
            </value>
        </block>
        ` : ''}

        ${blockSeparator}

        ${motion_changexby ? `
        <block type="motion_changexby">
            <value name="DX">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_setx ? `
        <block type="motion_setx">
            <value name="X">
                <shadow id="setx" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_changeyby ? `
        <block type="motion_changeyby">
            <value name="DY">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${motion_sety ? `
        <block type="motion_sety">
            <value name="Y">
                <shadow id="sety" type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${blockSeparator}

        ${motion_ifonedgebounce ? `
        <block type="motion_ifonedgebounce"/>
        ` : ''}

        ${blockSeparator}

        ${motion_setrotationstyle ? `
        <block type="motion_setrotationstyle"/>
        ` : ''}

        ${blockSeparator}
        
        ${motion_xyposition_direction ? `
        <block id="${targetId}_xposition" type="motion_xposition"/>
        <block id="${targetId}_yposition" type="motion_yposition"/>
        <block id="${targetId}_direction" type="motion_direction"/>
        ` : ''}
        `
        }
        ${categorySeparator}
    </category>
    `;
};

const xmlEscape = function (unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
        }
    });
};

const looks = function (
    isInitialSetup,
    isStage,
    targetId,
    costumeName,
    backdropName,
    colors,
    looks_sayforsecs,
    looks_say,
    looks_thinkforsecs,
    looks_think,
    looks_switchbackdropto,
    looks_switchbackdroptoandwait,
    looks_nextbackdrop,
    looks_switchcostumeto,
    looks_nextcostume,
    looks_changesizeby,
    looks_setsizeto,
    looks_changeeffectby,
    looks_seteffectto,
    looks_cleargraphiceffects,
    looks_show_hide,
    looks_gotofrontback,
    looks_goforwardbackwardlayers,
    looks_backdropnumbername,
    looks_numbername_size,
    showlooksCategory,
) {

    if (!showlooksCategory) return '';

    const hello = ScratchBlocks.ScratchMsgs.translate("LOOKS_HELLO", "Hello!");
    const hmm = ScratchBlocks.ScratchMsgs.translate("LOOKS_HMM", "Hmm...");
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    console.log("is stage testing lookk", isStage);
    return `
    <category name="%{BKY_CATEGORY_LOOKS}" id="looks" colour="${colors.primary
        }" secondaryColour="${colors.tertiary}">
        ${isStage
            ? ""
            : `
        ${looks_sayforsecs ? `
        <block type="looks_sayforsecs">
            <value name="MESSAGE">
                <shadow type="text">
                    <field name="TEXT">${hello}</field>
                </shadow>
            </value>
            <value name="SECS">
                <shadow type="math_number">
                    <field name="NUM">2</field>
                </shadow>
            </value>
        </block>
        ` : ''}

         ${looks_say ? `
        <block type="looks_say">
            <value name="MESSAGE">
                <shadow type="text">
                    <field name="TEXT">${hello}</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${looks_thinkforsecs ? `
        <block type="looks_thinkforsecs">
            <value name="MESSAGE">
                <shadow type="text">
                    <field name="TEXT">${hmm}</field>
                </shadow>
            </value>
            <value name="SECS">
                <shadow type="math_number">
                    <field name="NUM">2</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${looks_think ? `
        <block type="looks_think">
            <value name="MESSAGE">
                <shadow type="text">
                    <field name="TEXT">${hmm}</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${blockSeparator}
        `
        }
        ${isStage
            ? `

            ${looks_switchbackdropto ? `
            <block type="looks_switchbackdropto">
                <value name="BACKDROP">
                    <shadow type="looks_backdrops">
                        <field name="BACKDROP">${backdropName}</field>
                    </shadow>
                </value>
            </block>
            ` : ''}

            ${looks_switchbackdroptoandwait ? `
            <block type="looks_switchbackdroptoandwait">
                <value name="BACKDROP">
                    <shadow type="looks_backdrops">
                        <field name="BACKDROP">${backdropName}</field>
                    </shadow>
                </value>
            </block>
            ` : ''}

            ${looks_nextbackdrop ? `
            <block type="looks_nextbackdrop"/>
            ` : ''}
        `
            : `
            ${looks_switchcostumeto ? `
            <block id="${targetId}_switchcostumeto" type="looks_switchcostumeto">
                <value name="COSTUME">
                    <shadow type="looks_costume">
                        <field name="COSTUME">${costumeName}</field>
                    </shadow>
                </value>
            </block>
            ` : ''}

            ${looks_nextcostume ? `
            <block type="looks_nextcostume"/>
            ` : ''}

            ${looks_switchbackdropto ? `
            <block type="looks_switchbackdropto">
                <value name="BACKDROP">
                    <shadow type="looks_backdrops">
                        <field name="BACKDROP">${backdropName}</field>
                    </shadow>
                </value>
            </block>
            ` : ''}

            ${looks_nextbackdrop ? `
            <block type="looks_nextbackdrop"/>
            ` : ''}   

            ${blockSeparator}

            ${looks_changesizeby ? `
            <block type="looks_changesizeby">
                <value name="CHANGE">
                    <shadow type="math_number">
                        <field name="NUM">10</field>
                    </shadow>
                </value>
            </block>
            ` : ''} 

            ${looks_setsizeto ? `
            <block type="looks_setsizeto">
                <value name="SIZE">
                    <shadow type="math_number">
                        <field name="NUM">100</field>
                    </shadow>
                </value>
            </block>
            ` : ''} 
        `
        }
        ${blockSeparator}

        ${looks_changeeffectby ? `
        <block type="looks_changeeffectby">
            <value name="CHANGE">
                <shadow type="math_number">
                    <field name="NUM">25</field>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${looks_seteffectto ? `
        <block type="looks_seteffectto">
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${looks_cleargraphiceffects ? `
        <block type="looks_cleargraphiceffects"/>
        ` : ''}
   

        ${blockSeparator}
        ${isStage
            ? ""
            : `
            ${looks_show_hide ? `
            <block type="looks_show"/>
            <block type="looks_hide"/>
            ` : ''}


        ${blockSeparator}

            ${looks_gotofrontback ? `
            <block type="looks_gotofrontback"/>
            ` : ''}

            ${looks_goforwardbackwardlayers ? `
            <block type="looks_goforwardbackwardlayers">
                <value name="NUM">
                    <shadow type="math_integer">
                        <field name="NUM">1</field>
                    </shadow>
                </value>
            </block>
            ` : ''}
        `
        }
        ${isStage
            ? `
            ${looks_backdropnumbername ? `
            <block id="backdropnumbername" type="looks_backdropnumbername"/>
            ` : ''}
        `
            : `
             ${looks_numbername_size ? `
            <block id="${targetId}_costumenumbername" type="looks_costumenumbername"/>
            <block id="backdropnumbername" type="looks_backdropnumbername"/>
            <block id="${targetId}_size" type="looks_size"/>
             ` : ''}
        `
        }
        ${categorySeparator}
    </category>
    `;
};

const sound = function (
    isInitialSetup, 
    isStage, 
    targetId, 
    soundName, 
    colors,
    sound_playuntildone,
    sound_play,
    sound_stopallsounds,
    sound_changeeffectby,
    sound_seteffectto,
    sound_cleareffects,
    sound_changevolumeby,
    sound_setvolumeto,
    sound_volume,
    showsoundCategory,
) {
    if (!showsoundCategory) return '';
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category name="%{BKY_CATEGORY_SOUND}" id="sound" colour="${colors.primary}" secondaryColour="${colors.tertiary}">

        ${sound_playuntildone ? `
        <block id="${targetId}_sound_playuntildone" type="sound_playuntildone">
            <value name="SOUND_MENU">
                <shadow type="sound_sounds_menu">
                    <field name="SOUND_MENU">${soundName}</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_play ? `
        <block id="${targetId}_sound_play" type="sound_play">
            <value name="SOUND_MENU">
                <shadow type="sound_sounds_menu">
                    <field name="SOUND_MENU">${soundName}</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_stopallsounds ? `
        <block type="sound_stopallsounds"/>
        ` : ''}

        ${blockSeparator}

        ${sound_changeeffectby ? `
        <block type="sound_changeeffectby">
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_seteffectto ? `
        <block type="sound_seteffectto">
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">100</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_cleareffects ? `
        <block type="sound_cleareffects"/>
        ` : ''}

        ${blockSeparator}

        ${sound_changevolumeby ? `
        <block type="sound_changevolumeby">
            <value name="VOLUME">
                <shadow type="math_number">
                    <field name="NUM">-10</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_setvolumeto ? `
        <block type="sound_setvolumeto">
            <value name="VOLUME">
                <shadow type="math_number">
                    <field name="NUM">100</field>
                </shadow>
            </value>
        </block>
        ` : ''}

        ${sound_volume ? `
        <block id="${targetId}_volume" type="sound_volume"/>
        ` : ''}    

        ${categorySeparator}
    </category>
    `;
};

const events = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    event_whenflagclicked,
    event_whenkeypressed,
    event_whenstageclicked,
    event_whenthisspriteclicked,
    event_whenbackdropswitchesto,
    event_whengreaterthan,
    event_whenbroadcastreceived,
    event_broadcast,
    event_broadcastandwait,
    showeventCategory
) {
    if (!showeventCategory) return '';
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category name="%{BKY_CATEGORY_EVENTS}" id="events" colour="${colors.primary
        }" secondaryColour="${colors.tertiary}">
        
        ${event_whenflagclicked ? `
        <block type="event_whenflagclicked"/>
        ` : ''} 

        ${event_whenkeypressed ? `
        <block type="event_whenkeypressed">
        </block>
        ` : ''} 

        ${isStage
            ? `
            ${event_whenstageclicked ? `
            <block type="event_whenstageclicked"/>
            ` : ''} 
        `
            : `
            ${event_whenthisspriteclicked ? `
            <block type="event_whenthisspriteclicked"/>
            ` : ''} 
        `
        }
        ${event_whenbackdropswitchesto ? `
        <block type="event_whenbackdropswitchesto">
        </block>
        ` : ''} 

        ${blockSeparator}

        ${event_whengreaterthan ? `
        <block type="event_whengreaterthan">
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${blockSeparator}

        ${event_whenbroadcastreceived ? `
        <block type="event_whenbroadcastreceived">
        </block>
        ` : ''} 

        ${event_broadcast ? `
        <block type="event_broadcast">
            <value name="BROADCAST_INPUT">
                <shadow type="event_broadcast_menu"></shadow>
            </value>
        </block>
        ` : ''} 

        ${event_broadcastandwait ? `
        <block type="event_broadcastandwait">
            <value name="BROADCAST_INPUT">
              <shadow type="event_broadcast_menu"></shadow>
            </value>
        </block>
        ` : ''}

        ${categorySeparator}
    </category>
    `;
};

const control = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    control_wait,
    control_repeat,
    control_forever,
    control_if,
    control_if_else,
    control_wait_until,
    control_repeat_until,
    control_stop,
    control_create_clone_of,
    control_start_as_clone,
    control_delete_this_clone,
    showcontrolCategory
) {
    if (!showcontrolCategory) return '';
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category
        name="%{BKY_CATEGORY_CONTROL}"
        id="control"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}">

        ${control_wait ? `
        <block type="control_wait">
            <value name="DURATION">
                <shadow type="math_positive_number">
                    <field name="NUM">1</field>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${blockSeparator}

        ${control_repeat ? `
        <block type="control_repeat">
            <value name="TIMES">
                <shadow type="math_whole_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${control_forever ? `    
        <block id="forever" type="control_forever"/>
        ` : ''} 

        ${blockSeparator}
        
        ${control_if ? `
        <block type="control_if"/>
        ` : ''}     
        
        ${control_if_else ? `
        <block type="control_if_else"/>
        ` : ''}   

        ${control_wait_until ? `
        <block id="wait_until" type="control_wait_until"/>
        ` : ''}   
        
        ${control_repeat_until ? `
        <block id="repeat_until" type="control_repeat_until"/>
        ` : ''}  

        ${blockSeparator}

        ${control_stop ? `
        <block type="control_stop"/>
        ` : ''}

        ${blockSeparator}
        ${isStage
            ? `

            ${control_create_clone_of ? `    
            <block type="control_create_clone_of">
                <value name="CLONE_OPTION">
                    <shadow type="control_create_clone_of_menu"/>
                </value>
            </block>
            ` : ''}
        `
            : `
            ${control_start_as_clone ? `  
            <block type="control_start_as_clone"/>
            ` : ''}

            ${control_create_clone_of ? ` 
            <block type="control_create_clone_of">
                <value name="CLONE_OPTION">
                    <shadow type="control_create_clone_of_menu"/>
                </value>
            </block>
            ` : ''}

            ${control_delete_this_clone ? ` 
            <block type="control_delete_this_clone"/>
            ` : ''}
        `
        }
        ${categorySeparator}
    </category>
    `;
};

const sensing = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    sensing_touchingobject,
    sensing_touchingcolor,
    sensing_coloristouchingcolor,
    sensing_distanceto,
    sensing_askandwait,
    sensing_answer,
    sensing_keypressed,
    sensing_mousedown,
    sensing_mousex,
    sensing_mousey,
    sensing_setdragmode,
    sensing_loudness,
    sensing_timer,
    sensing_resettimer,
    sensing_of,
    sensing_current,
    sensing_dayssince2000,
    sensing_username,
    showsensingCategory
) {
    if (!showsensingCategory) return '';
    const name = ScratchBlocks.ScratchMsgs.translate(
        "SENSING_ASK_TEXT",
        "What's your name?"
    );
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category
        name="%{BKY_CATEGORY_SENSING}"
        id="sensing"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}">
        ${isStage
            ? ""
            : `
            ${sensing_touchingobject ? `
            <block type="sensing_touchingobject">
                <value name="TOUCHINGOBJECTMENU">
                    <shadow type="sensing_touchingobjectmenu"/>
                </value>
            </block>
            ` : ''} 

            ${sensing_touchingcolor ? `
            <block type="sensing_touchingcolor">
                <value name="COLOR">
                    <shadow type="colour_picker"/>
                </value>
            </block>
            ` : ''} 

            ${sensing_coloristouchingcolor ? `
            <block type="sensing_coloristouchingcolor">
                <value name="COLOR">
                    <shadow type="colour_picker"/>
                </value>
                <value name="COLOR2">
                    <shadow type="colour_picker"/>
                </value>
            </block>
            ` : ''} 

            ${sensing_distanceto ? `
            <block type="sensing_distanceto">
                <value name="DISTANCETOMENU">
                    <shadow type="sensing_distancetomenu"/>
                </value>
            </block>
            ` : ''} 

            ${blockSeparator}
        `
        }
        ${isInitialSetup
            ? ""
            : `

            ${sensing_askandwait ? `
            <block id="askandwait" type="sensing_askandwait">
                <value name="QUESTION">
                    <shadow type="text">
                        <field name="TEXT">${name}</field>
                    </shadow>
                </value>
            </block>
            ` : ''} 

        `
        }

        ${sensing_answer ? `
        <block id="answer" type="sensing_answer"/>
        ` : ''}    

        ${blockSeparator}

        ${sensing_keypressed ? `    
        <block type="sensing_keypressed">
            <value name="KEY_OPTION">
                <shadow type="sensing_keyoptions"/>
            </value>
        </block>
        ` : ''}         

        ${sensing_mousedown ? `  
        <block type="sensing_mousedown"/>
        ` : ''} 

        ${sensing_mousex ? `  
        <block type="sensing_mousex"/>
        ` : ''} 

        ${sensing_mousey ? `  
        <block type="sensing_mousey"/>
        ` : ''} 

        ${isStage
            ? ""
            : `
            ${blockSeparator}

            ${sensing_setdragmode ? `  
            '<block type="sensing_setdragmode" id="sensing_setdragmode"></block>'+
            ` : ''} 

            ${blockSeparator}
        `
        }
        ${blockSeparator}

        ${sensing_loudness ? `  
        <block id="loudness" type="sensing_loudness"/>
        ` : ''}     

        ${blockSeparator}

        ${sensing_timer ? ` 
        <block id="timer" type="sensing_timer"/>
        ` : ''}  

        ${sensing_resettimer ? `    
        <block type="sensing_resettimer"/>
        ` : ''}      

        ${blockSeparator}

        ${sensing_of ? `   
        <block id="of" type="sensing_of">
            <value name="OBJECT">
                <shadow id="sensing_of_object_menu" type="sensing_of_object_menu"/>
            </value>
        </block>
        ` : ''}          

        ${blockSeparator}

        ${sensing_current ? `     
        <block id="current" type="sensing_current"/>
        ` : ''}  

        ${sensing_dayssince2000 ? ` 
        <block type="sensing_dayssince2000"/>
        ` : ''}      

        ${blockSeparator}

        ${sensing_username ? `     
        <block type="sensing_username"/>
        ` : ''}     

        ${categorySeparator}
    </category>
    `;
};

const operators = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    operator_add,
    operator_subtract,
    operator_multiply,
    operator_divide,
    operator_random,
    operator_gt,
    operator_lt,
    operator_equals,
    operator_and,
    operator_or,
    operator_not,
    operator_join,
    operator_letter_of,
    operator_length,
    operator_contains,
    operator_mod,
    operator_round,
    operator_mathop,
    showoperatorsCategory,
) {
    if (!showoperatorsCategory) return '';

    const apple = ScratchBlocks.ScratchMsgs.translate(
        "OPERATORS_JOIN_APPLE",
        "apple"
    );
    const banana = ScratchBlocks.ScratchMsgs.translate(
        "OPERATORS_JOIN_BANANA",
        "banana"
    );
    const letter = ScratchBlocks.ScratchMsgs.translate(
        "OPERATORS_LETTEROF_APPLE",
        "a"
    );
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
    <category
        name="%{BKY_CATEGORY_OPERATORS}"
        id="operators"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}">

        ${operator_add ? `
        <block type="operator_add">
            <value name="NUM1">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
            <value name="NUM2">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}     

        ${operator_subtract ? `
        <block type="operator_subtract">
            <value name="NUM1">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
            <value name="NUM2">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${operator_multiply ? `
        <block type="operator_multiply">
            <value name="NUM1">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
            <value name="NUM2">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}    

        ${operator_divide ? `
        <block type="operator_divide">
            <value name="NUM1">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
            <value name="NUM2">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}        

        ${blockSeparator}

        ${operator_random ? `  
        <block type="operator_random">
            <value name="FROM">
                <shadow type="math_number">
                    <field name="NUM">1</field>
                </shadow>
            </value>
            <value name="TO">
                <shadow type="math_number">
                    <field name="NUM">10</field>
                </shadow>
            </value>
        </block>
        ` : ''}        

        ${blockSeparator}

        ${operator_gt ? `    
        <block type="operator_gt">
            <value name="OPERAND1">
                <shadow type="text">
                    <field name="TEXT"/>
                </shadow>
            </value>
            <value name="OPERAND2">
                <shadow type="text">
                    <field name="TEXT">50</field>
                </shadow>
            </value>
        </block>
        ` : ''}       

        ${operator_lt ? `
        <block type="operator_lt">
            <value name="OPERAND1">
                <shadow type="text">
                    <field name="TEXT"/>
                </shadow>
            </value>
            <value name="OPERAND2">
                <shadow type="text">
                    <field name="TEXT">50</field>
                </shadow>
            </value>
        </block>
        ` : ''}        

        ${operator_equals ? `
        <block type="operator_equals">
            <value name="OPERAND1">
                <shadow type="text">
                    <field name="TEXT"/>
                </shadow>
            </value>
            <value name="OPERAND2">
                <shadow type="text">
                    <field name="TEXT">50</field>
                </shadow>
            </value>
        </block>
        ` : ''} 

        ${blockSeparator}

        ${operator_and ? `
        <block type="operator_and"/>
        ` : ''} 

        ${operator_or ? `        
        <block type="operator_or"/>
        ` : ''} 

        ${operator_not ? `        
        <block type="operator_not"/>
        ` : ''}     

        ${blockSeparator}
        ${isInitialSetup
            ? ""
            : `

        ${operator_join ? ` 
            <block type="operator_join">
                <value name="STRING1">
                    <shadow type="text">
                        <field name="TEXT">${apple} </field>
                    </shadow>
                </value>
                <value name="STRING2">
                    <shadow type="text">
                        <field name="TEXT">${banana}</field>
                    </shadow>
                </value>
            </block>
        ` : ''}   

        ${operator_letter_of ? ` 
            <block type="operator_letter_of">
                <value name="LETTER">
                    <shadow type="math_whole_number">
                        <field name="NUM">1</field>
                    </shadow>
                </value>
                <value name="STRING">
                    <shadow type="text">
                        <field name="TEXT">${apple}</field>
                    </shadow>
                </value>
            </block>
        ` : ''}   

        ${operator_length ? `        
            <block type="operator_length">
                <value name="STRING">
                    <shadow type="text">
                        <field name="TEXT">${apple}</field>
                    </shadow>
                </value>
            </block>
        ` : ''}   

        ${operator_contains ? `        
            <block type="operator_contains" id="operator_contains">
              <value name="STRING1">
                <shadow type="text">
                  <field name="TEXT">${apple}</field>
                </shadow>
              </value>
              <value name="STRING2">
                <shadow type="text">
                  <field name="TEXT">${letter}</field>
                </shadow>
              </value>
            </block>
        ` : ''}   
        `
        }
        ${blockSeparator}

        ${operator_mod ? `        
        <block type="operator_mod">
            <value name="NUM1">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
            <value name="NUM2">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}   

        ${operator_round ? `        
        <block type="operator_round">
            <value name="NUM">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}   


        ${blockSeparator}

        ${operator_mathop ? `        
        <block type="operator_mathop">
            <value name="NUM">
                <shadow type="math_number">
                    <field name="NUM"/>
                </shadow>
            </value>
        </block>
        ` : ''}   


        ${categorySeparator}
    </category>
    `;
};

const variables = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    variables_myvariable,
    variables_setto,
    variables_changeby,
    variables_showvariable,
    variables_hidevariable,
    showvariablesCategory
) {
    if (!showvariablesCategory) return '';
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return `
     <category
        name="%{BKY_CATEGORY_VARIABLES}"
        id="variables"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}"
        custom="VARIABLE">
        ${isInitialSetup ? `
        <block type="variables_get">
            <field name="VAR">${variables_myvariable}</field>
        </block>
        <block type="variables_set">
            <field name="VAR">${variables_setto}</field>
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">0</field>
                </shadow>
            </value>
        </block>
        <block type="variables_change">
            <field name="VAR">${variables_changeby}</field>
            <value name="VALUE">
                <shadow type="math_number">
                    <field name="NUM">1</field>
                </shadow>
            </value>
        </block>
        ` : ''}
        ${isStage ? `
        <block type="variables_show">
            <field name="VAR">${variables_showvariable}</field>
        </block>
        <block type="variables_hide">
            <field name="VAR">${variables_hidevariable}</field>
        </block>
        ` : ''}
    </category>
    `;
};

const myBlocks = function (
    isInitialSetup,
    isStage,
    targetId,
    colors,
    myblocks_makeablock,
    showmyblocksCategory

) {
    if (!showmyblocksCategory) return '';
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.

    return `
    <category
        name="%{BKY_CATEGORY_MYBLOCKS}"
        id="myBlocks"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}"
        custom="PROCEDURE">
               ${myblocks_makeablock ? `   
        <block id="makeablock" type="myblocks_makeablock">
            <value name="OBJECT">
                <shadow id="myblocks_makeablock" type="myblocks_makeablock"/>
            </value>
        </block>
        ` : ''} 
    </category>
    `;
};
/* eslint-enable no-unused-vars */

const xmlOpen = '<xml style="display: none">';
const xmlClose = "</xml>";

/**
 * @param {!boolean} isInitialSetup - Whether the toolbox is for initial setup. If the mode is "initial setup",
 * blocks with localized default parameters (e.g. ask and wait) should not be loaded. (LLK/scratch-gui#5445)
 * @param {?boolean} isStage - Whether the toolbox is for a stage-type target. This is always set to true
 * when isInitialSetup is true.
 * @param {?string} targetId - The current editing target
 * @param {?Array.<object>} categoriesXML - optional array of `{id,xml}` for categories. This can include both core
 * and other extensions: core extensions will be placed in the normal Scratch order; others will go at the bottom.
 * @property {string} id - the extension / category ID.
 * @property {string} xml - the `<category>...</category>` XML for this extension / category.
 * @param {?string} costumeName - The name of the default selected costume dropdown.
 * @param {?string} backdropName - The name of the default selected backdrop dropdown.
 * @param {?string} soundName -  The name of the default selected sound dropdown.
 * @param {?object} colors - The colors for the theme.
 * @returns {string} - a ScratchBlocks-style XML document for the contents of the toolbox.
 */
const makeToolboxXML = function (
    isInitialSetup,
    isStage,
    targetId,
    categoriesXML = [],
    costumeName = "",
    backdropName = "",
    soundName = "",
    colors = defaultColors,
    showMotionCategory = true,
    motion_move_block = true,
    motion_turn_right_block = true,
    motion_turn_left_block = true,
    motion_goto = true,
    motion_gotoxy = true,
    motion_glideto = true,
    motion_glidesecstoxy = true,
    motion_pointindirection = true,
    motion_pointtowards = true,
    motion_changexby = true,
    motion_setx = true,
    motion_changeyby = true,
    motion_sety = true,
    motion_ifonedgebounce = true,
    motion_setrotationstyle = true,
    motion_xyposition_direction = true,
    showlooksCategory = true,
    looks_sayforsecs = true,
    looks_say = true,
    looks_thinkforsecs = true,
    looks_think = true,
    looks_switchbackdropto = true, 
    looks_switchbackdroptoandwait = true,
    looks_nextbackdrop = true,
    looks_switchcostumeto = true,
    looks_nextcostume = true,
    looks_changesizeby = true,
    looks_setsizeto = true,
    looks_changeeffectby = true,
    looks_seteffectto = true,
    looks_cleargraphiceffects = true,
    looks_show_hide = true,
    looks_gotofrontback = true,
    looks_goforwardbackwardlayers = true,
    looks_backdropnumbername = true,
    looks_numbername_size = true, 
    showsoundCategory = true,
    sound_playuntildone = true,
    sound_play = true, 
    sound_stopallsounds = true,
    sound_changeeffectby = true,
    sound_seteffectto = true,
    sound_cleareffects = true,
    sound_changevolumeby = true,
    sound_setvolumeto = true,
    sound_volume = true,
    showeventCategory = true,
    event_whenflagclicked = true,
    event_whenkeypressed = true,
    event_whenstageclicked = true,
    event_whenthisspriteclicked = true,
    event_whenbackdropswitchesto = true,
    event_whengreaterthan = true,
    event_whenbroadcastreceived = true,
    event_broadcast = true,
    event_broadcastandwait = true,
    showcontrolCategory = true,
    control_wait = true,
    control_repeat = true,
    control_forever = true, 
    control_if = true,
    control_if_else = true,
    control_wait_until = true,
    control_repeat_until = true,
    control_stop = true,
    control_create_clone_of = true,
    control_start_as_clone = true,
    control_delete_this_clone = true,
    showsensingCategory = true,
    sensing_touchingobject = true,
    sensing_touchingcolor = true,
    sensing_coloristouchingcolor = true,
    sensing_distanceto = true, 
    sensing_askandwait = true,
    sensing_answer = true,
    sensing_keypressed = true,
    sensing_mousedown = true,
    sensing_mousex = true,
    sensing_mousey = true,
    sensing_setdragmode = true,
    sensing_loudness = true,
    sensing_timer = true,
    sensing_resettimer = true,
    sensing_of = true,
    sensing_current = true,
    sensing_dayssince2000 = true,
    sensing_username = true,
    showoperatorsCategory = true,
    operator_add = true,
    operator_subtract = true,
    operator_multiply = true,
    operator_divide = true,
    operator_random = true,
    operator_gt = true,
    operator_lt = true,
    operator_equals = true,
    operator_and = true,
    operator_or = true,
    operator_not = true,
    operator_join = true,
    operator_letter_of = true,
    operator_length = true,
    operator_contains = true,
    operator_mod = true,
    operator_round = true,
    operator_mathop = true,
    showvariablesCategory = true,
    variables_myvariable = true,
    variables_setto = true,
    variables_changeby = true,
    variables_showvariable = true,
    variables_hidevariable = true,
    showmyblocksCategory = true,
    myblocks_makeablock = true,

) {
    isStage = isInitialSetup || isStage;
    const gap = [categorySeparator];

    costumeName = xmlEscape(costumeName);
    backdropName = xmlEscape(backdropName);
    soundName = xmlEscape(soundName);

    categoriesXML = categoriesXML.slice();
    const moveCategory = (categoryId) => {
        const index = categoriesXML.findIndex(
            (categoryInfo) => categoryInfo.id === categoryId
        );
        if (index >= 0) {
            // remove the category from categoriesXML and return its XML
            const [categoryInfo] = categoriesXML.splice(index, 1);
            return categoryInfo.xml;
        }
        // return `undefined`
    };

    const motionXML =
        moveCategory("motion") ||
        (showMotionCategory ? motion(
            isInitialSetup,
            isStage = false,
            targetId,
            colors.motion,
            motion_move_block,
            motion_turn_right_block,
            motion_turn_left_block,
            motion_goto,
            motion_gotoxy,
            motion_glideto,
            motion_glidesecstoxy,
            motion_pointindirection,
            motion_pointtowards,
            motion_changexby,
            motion_setx,
            motion_changeyby,
            motion_sety,
            motion_ifonedgebounce,
            motion_setrotationstyle,
            motion_xyposition_direction,
            showMotionCategory
        ) : '');
    const looksXML =
        moveCategory("looks") ||
        (showlooksCategory ? looks(
            isInitialSetup,
            isStage,
            targetId,
            costumeName,
            backdropName,
            colors.looks,
            looks_sayforsecs,
            looks_say,
            looks_thinkforsecs,
            looks_think,
            looks_switchbackdropto,
            looks_switchbackdroptoandwait,
            looks_nextbackdrop,
            looks_switchcostumeto,
            looks_nextcostume,
            looks_changesizeby,
            looks_setsizeto,
            looks_changeeffectby,
            looks_seteffectto,
            looks_cleargraphiceffects,
            looks_show_hide,
            looks_gotofrontback,
            looks_goforwardbackwardlayers,
            looks_backdropnumbername,
            looks_numbername_size,
            showlooksCategory,
        ) : '');
    const soundXML =
        moveCategory("sound") ||
        (showsoundCategory ? sound(
            isInitialSetup,
            isStage,
            targetId,
            soundName,
            colors.sounds,
            sound_playuntildone,
            sound_play,
            sound_stopallsounds,
            sound_changeeffectby,
            sound_seteffectto,
            sound_cleareffects,
            sound_changevolumeby,
            sound_setvolumeto,
            sound_volume,
            showsoundCategory,
        ) : '');
    const eventsXML =
        moveCategory("event") ||
        (showeventCategory ? events(
            isInitialSetup,
            isStage,
            targetId,
            colors.event,
            event_whenflagclicked,
            event_whenkeypressed,
            event_whenstageclicked,
            event_whenthisspriteclicked,
            event_whenbackdropswitchesto,
            event_whengreaterthan,
            event_whenbroadcastreceived,
            event_broadcast,
            event_broadcastandwait,
            showeventCategory,
        ) : '');
    const controlXML =
        moveCategory("control") ||
        (showcontrolCategory ? control(
            isInitialSetup,
            isStage,
            targetId,
            colors.control,
            control_wait,
            control_repeat,
            control_forever,
            control_if,
            control_if_else,
            control_wait_until,
            control_repeat_until,
            control_stop,
            control_create_clone_of,
            control_start_as_clone,
            control_delete_this_clone,
            showcontrolCategory
        ) : '');
    const sensingXML =
        moveCategory("sensing") ||
        (showsensingCategory ? sensing(
            isInitialSetup,
            isStage,
            targetId,
            colors.sensing,
            sensing_touchingobject,
            sensing_touchingcolor,
            sensing_coloristouchingcolor,
            sensing_distanceto,
            sensing_askandwait,
            sensing_answer,
            sensing_keypressed,
            sensing_mousedown,
            sensing_mousex,
            sensing_mousey,
            sensing_setdragmode,
            sensing_loudness,
            sensing_timer,
            sensing_resettimer,
            sensing_of,
            sensing_current,
            sensing_dayssince2000,
            sensing_username,
            showsensingCategory
        ) : '');
    const operatorsXML =
        moveCategory("operators") ||
        (showoperatorsCategory ? operators(
            isInitialSetup,
            isStage,
            targetId,
            colors.operators,
            operator_add,
            operator_subtract,
            operator_multiply,
            operator_divide,
            operator_random,
            operator_gt,
            operator_lt,
            operator_equals,
            operator_and,
            operator_or,
            operator_not,
            operator_join,
            operator_letter_of,
            operator_length,
            operator_contains,
            operator_mod,
            operator_round,
            operator_mathop,
            showoperatorsCategory,
        ) : '');
    const variablesXML =
        moveCategory("data") ||
        variables(
            isInitialSetup,
            isStage,
            targetId,
            colors.data,
            showvariablesCategory,
            variables_myvariable,
            variables_setto,
            variables_changeby,
            variables_showvariable,
            variables_hidevariable,
        );
    const myBlocksXML =
        moveCategory("procedures") ||
        myBlocks(
            isInitialSetup,
            isStage,
            targetId,
            colors.more,
            showmyblocksCategory,
            myblocks_makeablock,);

    const everything = [
        xmlOpen,
        motionXML,
        gap,
        looksXML,
        gap,
        soundXML,
        gap,
        eventsXML,
        gap,
        controlXML,
        gap,
        sensingXML,
        gap,
        operatorsXML,
        gap,
        variablesXML,
        gap,
        myBlocksXML,
    ];

    for (const extensionCategory of categoriesXML) {
        everything.push(gap, extensionCategory.xml);
    }

    everything.push(xmlClose);
    return everything.join("\n");
};

export default makeToolboxXML;

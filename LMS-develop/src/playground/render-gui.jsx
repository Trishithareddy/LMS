import React from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'redux';
import GUI from '../containers/gui.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import log from '../lib/log.js';
import './index.css';
const onClickLogo = () => {
    window.location = 'https://scratch.mit.edu';
};

const handleTelemetryModalCancel = () => {
    log('User canceled telemetry modal');
};

const handleTelemetryModalOptIn = () => {
    log('User opted into telemetry');
};

const handleTelemetryModalOptOut = () => {
    log('User opted out of telemetry');
};

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default (appTarget, projectData) => {
    // Add console logs to check projectData
    console.log('render-gui.jsx - Received projectData:', projectData);

    GUI.setAppElement(appTarget);

    // Create a component to check projectData on mount
    const WrappedGuiWithData = props => {
        React.useEffect(() => {
            // console.log('WrappedGuiWithData mounted with projectData:', props.projectData); 
            // Access projectData from props
        }, []);
    
        return <GUI {...props} />;
    };
    
    const WrappedGui = compose(
        AppStateHOC,
        HashParserHOC
    )(GUI);

    // TODO a hack for testing the backpack, allow backpack host to be set by url param
    const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
    const backpackHost = backpackHostMatches ? backpackHost[1] : null;

    const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // parse 'true' into `true`, 'false' into `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // it's not JSON so just use the string
            // note that a typo like "falsy" will be treated as true
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
        // Warn before navigating away
        window.onbeforeunload = () => true;
    }

    ReactDOM.render(
        // important: this is checking whether `simulateScratchDesktop` is truthy, not just defined!
        // simulateScratchDesktop ?
        //     <WrappedGui
        //         canEditTitle
        //         isScratchDesktop
        //         showTelemetryModal
        //         canSave={false}
        //         onTelemetryModalCancel={handleTelemetryModalCancel}
        //         onTelemetryModalOptIn={handleTelemetryModalOptIn}
        //         onTelemetryModalOptOut={handleTelemetryModalOptOut}
        //     /> :
        // <div style={{ display: 'flex', minWidth: '1000px', position: 'relative' }}>
        //     <div style={{ flex: '3' }}>
        //         <WrappedGui
        //             canEditTitle
        //             backpackVisible
        //             showComingSoon
        //             backpackHost={backpackHost}
        //             canSave={false}
        //             onClickLogo={onClickLogo}
        //         />
        //     </div>
            <WrappedGui
                    canEditTitle
                    backpackVisible
                    showComingSoon
                    backpackHost={backpackHost}
                    canSave={false}
                    onClickLogo={onClickLogo}
                />
        //     {/* <div style={{ flex: '1', border: '2px solid black', textAlign: 'center', minHeight: '100vh'}}>
        //         <InstructionComponent />
        //     </div> */}
            // <BackToTopButton/> 
        // {/* </div>, */}
        ,
        appTarget
    );
};
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setOrientation, setMobileView } from '../reducers/orientation.js';
import debounce from 'lodash/debounce';

const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
};

const OrientationHOC = (WrappedComponent) => {
    class OrientationComponent extends React.Component {
        constructor(props) {
            super(props);
            this.handleOrientationChange = this.handleOrientationChange.bind(this);
            this.debouncedOrientationChange = debounce(this.handleOrientationChange, 250);
        }

        componentDidMount() {
            this.handleOrientationChange(); // Initial check
            window.addEventListener('resize', this.debouncedOrientationChange);
            window.addEventListener('orientationchange', this.handleOrientationChange);
        }

        componentWillUnmount() {
            window.removeEventListener('resize', this.debouncedOrientationChange);
            window.removeEventListener('orientationchange', this.handleOrientationChange);
            this.debouncedOrientationChange.cancel();
        }

        handleOrientationChange() {
            const isMobile = isMobileDevice() || document.documentElement.clientWidth <= 768;
            const isPortrait = window.innerHeight > window.innerWidth;

            this.props.onSetMobileView(isMobile);
            this.props.onSetOrientation(isMobile && isPortrait ? 'portrait' : 'landscape');

            console.log("Orientation change detected:");
            console.log("isMobile:", isMobile);
            console.log("isPortrait:", isPortrait);
        }

        render() {
            const { orientation, mobileView, ...componentProps } = this.props;
            return (
                <WrappedComponent
                    orientation={orientation}
                    mobileView={mobileView}
                    {...componentProps}
                />
            );
        }
    }

    OrientationComponent.propTypes = {
        orientation: PropTypes.string.isRequired,
        mobileView: PropTypes.bool.isRequired,
        onSetOrientation: PropTypes.func.isRequired,
        onSetMobileView: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        orientation: state.scratchGui.orientation.orientation,
        mobileView: state.scratchGui.orientation.mobileView,
    });

    const mapDispatchToProps = {
        onSetOrientation: setOrientation,
        onSetMobileView: setMobileView
    };

    return connect(mapStateToProps, mapDispatchToProps)(OrientationComponent);
};

export default OrientationHOC;
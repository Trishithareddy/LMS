import emStyled from "@emotion/styled";
import { CacheProvider, Global, ThemeContext, css, keyframes } from "@emotion/react";
import createCache from "@emotion/cache";
import PropTypes from "prop-types";
import React from "react";

let cache;

if (typeof document === "object") {
    cache = createCache({
        key: "css",
        prepend: true,
    });
}

export default function styled(tag, options) {
    const stylesFactory = emStyled(tag, options);

    if (import.meta.env.DEV) {
        return (...styles) => {
            const component =
                typeof tag === "string" ? `"${tag}"` : "component";

            if (styles.length === 0) {
                console.error(
                    [
                        `MUI: Seems like you called styled(${component})() without a style argument.`,
                        'You must provide a styles argument: styled("div")(styleYouForgotToPass).',
                    ].join("\n")
                );
            } else if (styles.some((style) => style === undefined)) {
                console.error(
                    `MUI: the styled(${component})(...args) API requires all its args to be defined.`
                );
            }

            return stylesFactory(...styles);
        };
    }

    return stylesFactory;
}

export const internal_processStyles = (tag, processor) => {
    if (Array.isArray(tag?.__emotion_styles)) {
        tag.__emotion_styles = processor(tag.__emotion_styles);
    }
};

export function StyledEngineProvider({ injectFirst, children }) {
    return injectFirst && cache
        ? React.createElement(CacheProvider, { value: cache }, children)
        : children;
}

StyledEngineProvider.propTypes = {
    children: PropTypes.node,
    injectFirst: PropTypes.bool,
};

export function GlobalStyles({ styles, defaultTheme = {} }) {
    const globalStyles =
        typeof styles === "function"
            ? (themeInput) =>
                  styles(
                      !themeInput || Object.keys(themeInput).length === 0
                          ? defaultTheme
                          : themeInput
                  )
            : styles;

    return React.createElement(Global, { styles: globalStyles });
}

GlobalStyles.propTypes = {
    defaultTheme: PropTypes.object,
    styles: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.string,
        PropTypes.object,
        PropTypes.func,
    ]),
};

export { ThemeContext, css, keyframes };

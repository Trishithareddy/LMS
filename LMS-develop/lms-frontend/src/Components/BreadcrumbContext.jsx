// BreadcrumbContext.js
import React, { createContext, useState } from 'react';

export const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
    const [breadcrumbTrail, setBreadcrumbTrail] = useState([]);

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbTrail, setBreadcrumbTrail }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};
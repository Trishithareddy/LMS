// BreadcrumbsComponent.js
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbContext } from './BreadcrumbContext';

const BreadcrumbsComponent = () => {
    const { breadcrumbTrail } = useContext(BreadcrumbContext);

    return (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            {breadcrumbTrail.map((item, index) => {
                const isLast = index === breadcrumbTrail.length - 1;
                return isLast ? (
                    <Typography key={item.path} color="text.primary">
                        {item.name}
                    </Typography>
                ) : (
                    <Link 
                        key={item.path} 
                        to={item.path}
                        state={item.state ? item.state:""}
                        style={{ textDecoration: 'none', color: '#07752A' }}
                    >
                        {item.name}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
};

export default BreadcrumbsComponent;
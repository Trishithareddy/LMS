import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  Groups,
  School,
  Person,
  Settings,
  AdminPanelSettings,
  Insights,
  ManageAccounts
} from '@mui/icons-material';

const drawerWidth = 240;


const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Dashboard },
  { id: 'operations', label: 'Operations Center', icon: ManageAccounts },
  { id: 'analytics', label: 'Usage Analytics', icon: Insights },
  { id: 'batches', label: 'Batches', icon: Groups },
  { id: 'students', label: 'Students', icon: School },
  { id: 'teachers', label: 'Teachers', icon: Person },
  { id: 'profile', label: 'Profile Settings', icon: Settings }
];

const Sidebar = ({ selectedView, onViewChange, mobileOpen, onMobileToggle }) => {
 const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <AdminPanelSettings sx={{ color: '#2E7D32', mr: 1, fontSize: 32 }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
            School Admin
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Administration Dashboard
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={selectedView === item.id}
                onClick={() => onViewChange(item.id)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: '#E8F5E8',
                    color: '#2E7D32',
                    '& .MuiListItemIcon-root': {
                      color: '#2E7D32'
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#F5F5F5'
                  }
                }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: '#FAFAFA',
            borderRight: '1px solid #E0E0E0'
          }
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default Sidebar

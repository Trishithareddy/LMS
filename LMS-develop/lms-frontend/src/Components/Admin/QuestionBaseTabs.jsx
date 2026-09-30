import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import * as React from 'react';
import { BreadcrumbContext } from '../BreadcrumbContext';
import AllQuestions from './AllQuestions';
import CreateQuestion from './CreateQuestion';

export default function QuestionBaseTabs() {
  const [value, setValue] = React.useState('1');
  const { setBreadcrumbTrail } = React.useContext(BreadcrumbContext);

  React.useEffect(() => {
    setBreadcrumbTrail([
        { name: 'Admin Dashboard', path: '/admin-dashboard' },
        { name: 'Question Base', path: '/admin-dashboard/question-base-tabs' }
    ]);
}, []);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="All Questions" value="1" />
            <Tab label="Create Question" value="2" />
            
          </TabList>
        </Box>
        <TabPanel value="1">
            <AllQuestions/>
        </TabPanel>
        <TabPanel value="2">
            <CreateQuestion/>
        </TabPanel>
        
      </TabContext>
    </Box>
  );
}

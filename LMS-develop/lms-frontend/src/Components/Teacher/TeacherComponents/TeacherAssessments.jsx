import React, {useContext, useEffect} from 'react'
import { BreadcrumbContext } from "../../BreadcrumbContext";

function TeacherAssessments() {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Teacher Dashboard', path: '/teacher-dashboard' },
            { name: 'Assessments', path: '/teacher-dashboard/assessments' },
        ]);
    }, []);

  return (
    <div style={{fontSize:"40px"}}>.....</div>
  )
}

export default TeacherAssessments
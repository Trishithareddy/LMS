const UserBadge = require("../models/UserBadge");

function getCurrentAcademicYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // June–Dec → current to next year
    if (month >= 3) {
        return `${year}-${year + 1}`;
    }

    // Jan–May → previous to current year
    return `${year - 1}-${year}`;
}

async function archiveOldTeacherBadges() {
    const currentAcademicYear = getCurrentAcademicYear();

    const result = await UserBadge.updateMany(
        {
            userRole: "teacher",
            academicYear: { $ne: currentAcademicYear },
            isArchived: { $ne: true },
        },
        {
            $set: { isArchived: true },
        }
    );

    // console.log(
    //     `📦 Archived ${result.modifiedCount} teacher badges (older than ${currentAcademicYear})`
    // );
}

module.exports = {
    archiveOldTeacherBadges,
    getCurrentAcademicYear,
};

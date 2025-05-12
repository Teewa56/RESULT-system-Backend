const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./courses.json', 'utf8'));
const canonical = {};
function normalizeCode(code) {
    const match = code.match(/([A-Za-z]+)\s*(\d{3})/);
    if (match) {
        return `${match[1].toUpperCase()} ${match[2]}`;
    }
    return code;
}
function updateCourses(courses) {
    courses.forEach(course => {
        const norm = normalizeCode(course["Course-Code"]);
        course["Course-Code"] = norm;
        if (canonical[norm]) {
            course["Course-Title"] = canonical[norm].title;
            course["Course-Units"] = canonical[norm].units;
        } else {
            canonical[norm] = {
                title: course["Course-Title"],
                units: course["Course-Units"]
            };
        }
    });
    return courses;
}
for (const dept in data) {
    const levelObj = data[dept];
    for (const level in levelObj) {
        const semesterObj = levelObj[level];
        for (const semester in semesterObj) {
            if (Array.isArray(semesterObj[semester])) {
                semesterObj[semester] = updateCourses(semesterObj[semester]);
            }
        }
    }
}
fs.writeFileSync('courses_corrected.json', JSON.stringify(data, null, 4));
console.log("The updated courses file has been written to courses_corrected.json");
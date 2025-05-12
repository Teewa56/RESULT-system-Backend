const fs = require('fs');

const filePath = './courses.json'; 
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function extractCourses(data) {
    const courses = [];

    function traverse(obj) {
        if (Array.isArray(obj)) {
            obj.forEach((course) => {
                if (course['Course-Code'] && course['Course-Title']) {
                    courses.push({
                        code: course['Course-Code'],
                        title: course['Course-Title'],
                        units: course['Course-Units'],
                    });
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(traverse);
        }
    }

    traverse(data);
    return courses;
}

// Extract courses and save to a new file
const courses = extractCourses(data);
fs.writeFileSync('./allCourses.json', JSON.stringify(courses, null, 2), 'utf8');

console.log(`Extracted ${courses.length} courses. Saved to allCourses.json.`);
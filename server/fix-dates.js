const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: String,
    date: Date,
    quarter: String,
    year: Number
}, { strict: false });

const Project = mongoose.model('Project', projectSchema);

async function run() {
    await mongoose.connect('mongodb://localhost:27017/project-tracker');

    // Find projects with date = January 1, 2026
    const jan1 = new Date('2026-01-01T00:00:00');
    const jan2 = new Date('2026-01-02T00:00:00');

    const projects = await Project.find({
        date: { $gte: jan1, $lt: jan2 }
    }).select('projectName date quarter year');

    console.log('Found ' + projects.length + ' projects with date 1 January 2026:');
    projects.forEach(p => {
        console.log('  - ' + p.projectName + ' (' + p.quarter + ')');
    });

    // Delete these entries so user can re-import or manually fix
    if (projects.length > 0) {
        const result = await Project.deleteMany({
            date: { $gte: jan1, $lt: jan2 }
        });
        console.log('\nDeleted ' + result.deletedCount + ' projects with incorrect dates.');
        console.log('You can now use Carry Forward again - it will keep the original dates.');
    }

    await mongoose.disconnect();
}

run().catch(console.error);

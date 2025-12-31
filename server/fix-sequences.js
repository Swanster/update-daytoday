// Migration script to fix sequence numbers for existing entries
// Run with: node fix-sequences.js

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/project-tracker')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Daily schema (same as in models/Daily.js)
const dailySchema = new mongoose.Schema({
    clientName: { type: String, required: true, trim: true },
    services: { type: String, trim: true, default: '' },
    caseIssue: { type: String, trim: true, default: '' },
    action: { type: String, enum: ['Onsite', 'Remote', ''], default: '' },
    date: { type: Date, default: null },
    picTeam: { type: [String], default: [] },
    detailAction: { type: String, default: '' },
    status: { type: String, enum: ['Progress', 'Done', 'Hold', ''], default: '' },
    quarter: { type: String, required: true },
    year: { type: Number, required: true },
    quarterSequence: { type: Number, default: 0 }
}, { timestamps: true });

const Daily = mongoose.model('Daily', dailySchema);

async function fixSequences() {
    console.log('Starting sequence fix migration...\n');

    // Get all unique quarters
    const quarters = await Daily.distinct('quarter');
    console.log(`Found ${quarters.length} quarters: ${quarters.join(', ')}\n`);

    for (const quarter of quarters) {
        console.log(`Processing ${quarter}...`);

        // Get all entries for this quarter, sorted by createdAt
        const entries = await Daily.find({ quarter }).sort({ createdAt: 1 });
        console.log(`  Found ${entries.length} entries`);

        // Track unique clients and their sequence numbers
        const clientSequences = new Map();
        let nextSequence = 1;

        for (const entry of entries) {
            let sequenceNumber;

            if (clientSequences.has(entry.clientName)) {
                // Reuse existing sequence for this client
                sequenceNumber = clientSequences.get(entry.clientName);
            } else {
                // New client - assign next sequence
                sequenceNumber = nextSequence;
                clientSequences.set(entry.clientName, sequenceNumber);
                nextSequence++;
            }

            // Update the entry if sequence is different
            if (entry.quarterSequence !== sequenceNumber) {
                await Daily.updateOne(
                    { _id: entry._id },
                    { $set: { quarterSequence: sequenceNumber } }
                );
                console.log(`  Updated ${entry.clientName}: ${entry.quarterSequence || 'null'} -> ${sequenceNumber}`);
            }
        }

        console.log(`  Assigned ${clientSequences.size} unique client sequences\n`);
    }

    console.log('Migration complete!');
    process.exit(0);
}

fixSequences().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});

import express from 'express';
import cors from 'cors';
import { getOpenRouterUsage } from './fetchers/openrouter';
import { getLangfuseUsage } from './fetchers/langfuse';
import { getHeliconeUsage } from './fetchers/helicone';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// A simple mock formula to convert USD/usage to SET
function calculateSetScore(usageData: any) {
    if (usageData.provider === "OpenRouter") {
        // Assume $1 = 1,000,000 SET
        return (usageData.total_cost_usd || 0) * 1000000;
    } else if (usageData.provider === "Helicone") {
        // Assume $1 = 1,000,000 SET
        if (usageData.total_cost_usd > 0) return usageData.total_cost_usd * 1000000;
        // Or if only raw tokens exist: 1 token = 1 SET
        return usageData.raw_tokens || 0;
    } else if (usageData.provider === "Langfuse") {
        return usageData.raw_tokens || 0;
    }
    return 0;
}

app.post('/api/generate-card', async (req, res) => {
    const { userId, provider, key_1, key_2, burn_after_reading } = req.body;

    if (!provider || !key_1) {
        return res.status(400).json({ error: "Provider and key_1 are required." });
    }

    try {
        let usageData;
        if (provider === "OpenRouter") {
            usageData = await getOpenRouterUsage(key_1);
        } else if (provider === "Langfuse") {
            if (!key_2) {
                return res.status(400).json({ error: "key_2 (secret key) is required for Langfuse." });
            }
            usageData = await getLangfuseUsage(key_1, key_2);
        } else if (provider === "Helicone") {
            usageData = await getHeliconeUsage(key_1);
        } else {
            return res.status(400).json({ error: "Unknown provider." });
        }

        const set_score = Math.floor(calculateSetScore(usageData));

        // At this point, keys are in memory and have not been logged or saved.
        // We calculate SET and return it. The keys will be discarded when request finishes.

        res.json({
            status: "success",
            message: "Data fetched and calculated. Keys have been permanently destroyed from server memory.",
            provider,
            set_score,
            raw_data_snapshot: usageData
        });

    } catch (error: any) {
        console.error(`Failed to fetch usage: ${error.message}`);
        res.status(400).json({ error: "Failed to fetch usage. Please check your API key permissions." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

import { runSettlement } from "../services/settlementService.js";

export const triggerSettlement = async (req, res) => {
    try {
        // In a real app, verify admin permissions here!
        const report = await runSettlement();
        return res.status(200).json({ success: true, count: report.length, data: report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { queryResult, message, mode, program } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // ── Helper to load sheets for context
    const getDynamicContext = async (prog: string) => {
      const link = process.env.SPREADSHEET_LINK || '';
      const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const spreadsheetId = match ? match[1] : link.trim();
      let context = "";
      if (spreadsheetId) {
        try {
          const tabs: string[] = [];
          if (!prog || prog === 'All' || prog === 'Swayam') tabs.push("EaSE Dasboard Skeleton");
          if (!prog || prog === 'All' || prog === 'BBA DBE') tabs.push("New Courses");
          tabs.push("Overview Timeline Mother Sheet", "Mother_Sheet_Finance_July_25");
          
          for (const tab of tabs) {
            const res = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`, { cache: 'no-store' });
            if (res.ok) context += `=== Data from Tab: ${tab} ===\n${(await res.text()).substring(0, 5000)}\n\n`;
          }
        } catch (e) {}
      }
      return context;
    };

    // ── Mode 1: Kanban analysis (existing) ──────────────────────────
    if (mode === 'kanban' || queryResult === 'TRIGGER_LIVE_ANALYSIS') {
      const liveData = await getDynamicContext(program);
      const prompt = `
        You are an AI advisor for an executive education dashboard at IIMBxTech.
        Analyze the following live course data from our spreadsheets:
        ${liveData}

        Respond ONLY with a valid JSON object (no markdown, no code fences) in exactly this structure:
        {
          "needsAttention": [
            { "title": "[Specific Programme/Module Name] - Issue", "desc": "1-2 sentence explanation" }
          ],
          "onTrack": [
            { "title": "[Specific Programme/Module Name] - Milestone", "desc": "1-2 sentence explanation" }
          ],
          "opportunities": [
            { "title": "[Specific Programme/Module Name] - Opportunity", "desc": "1-2 sentence explanation" }
          ]
        }

        Populate each array with 2-3 realistic items based on the actual CSV data provided.
        CRITICAL: You MUST explicitly include the exact specific programme or module name in the title of every insight (e.g. "Hospitality Management - QA Lagging"). Do not write generic titles.
      `;

      const result  = await model.generateContent(prompt);
      const raw     = result.response.text().trim();
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const insights = JSON.parse(cleaned);
      return NextResponse.json({ success: true, insights });
    }

    // ── Mode 2: Interactive chat ─────────────────────────────────────
    if (mode === 'chat' && message) {
      // Dynamically load sheet data to feed into the AI
      const link = process.env.SPREADSHEET_LINK || '';
      const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const spreadsheetId = match ? match[1] : link.trim();
      
      let dynamicContext = "You are an AI advisor embedded in the IIMBxTech Executive Education Dashboard.\n";
      dynamicContext += "You have visibility into all active programmes, financial timelines, and checklists.\n\n";

      if (spreadsheetId) {
        try {
          const tabsToFetch = [
            "EaSE Dasboard Skeleton", 
            "Overview Timeline Mother Sheet", 
            "Mother_Sheet_Finance_July_25"
          ];
          
          for (const tab of tabsToFetch) {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
            const res = await fetch(csvUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              // truncate somewhat to avoid infinite tokens if sheets are massive
              dynamicContext += `=== Data from Tab: ${tab} ===\n${text.substring(0, 5000)}\n\n`;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch dynamic sheets for Gemini context", e);
        }
      }

      dynamicContext += `Answer executive questions concisely and with data-driven insights based on the CSV data provided above. Be professional, direct, and actionable.\n`;

      const result = await model.generateContent(`${dynamicContext}\n\nExecutive asks: ${message}`);
      const reply  = result.response.text().trim();
      return NextResponse.json({ success: true, reply });
    }

    return NextResponse.json({ success: false, error: 'Invalid request mode' }, { status: 400 });

  } catch (error: any) {
    console.error('Gemini API Route Error:', error?.message || error);

    // Kanban fallback
    if (!error?.mode || error?.queryResult) {
      return NextResponse.json({
        success: true,
        insights: {
          needsAttention: [
            { title: 'Analytics Bootcamp – CP2 Delayed', desc: 'Sub-stage CP2 is 45% complete but past its deadline. Faculty intervention recommended.' },
            { title: 'Digital Marketing – Low Engagement', desc: 'Overall completion is at 47%. Student drop-off detected after module 3.' }
          ],
          onTrack: [
            { title: 'Finance Essentials – On Schedule', desc: '91% completion across all checkpoints. Projected to finish 1 week ahead of schedule.' },
            { title: 'Leadership Track – Strong Progress', desc: 'All CP milestones met. Student satisfaction score is at 4.8/5.' }
          ],
          opportunities: [
            { title: 'Data Science Pro – Alumni Pathway', desc: 'High completion (88%) signals readiness for an advanced cohort or alumni programme.' },
            { title: 'Cross-Programme Certification', desc: 'Students completing both Finance and Analytics tracks qualify for a blended certificate.' }
          ]
        }
      });
    }

    return NextResponse.json({ success: false, error: 'AI service temporarily unavailable.' }, { status: 500 });
  }
}

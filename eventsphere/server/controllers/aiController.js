import { GoogleGenerativeAI } from '@google/generative-ai';
import Sponsor from '../models/Sponsor.js';
import User from '../models/User.js';

// @desc    Match sponsors to an event using AI (or fallback heuristic)
// @route   POST /api/ai/sponsor-match
// @access  Private (Organizer/Sponsor/Admin only)
export const matchSponsors = async (req, res, next) => {
  try {
    const { eventTitle, category, audienceSize, tags } = req.body;

    if (!eventTitle || !category || !audienceSize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventTitle, category, and audienceSize'
      });
    }

    // Fetch all verified sponsors
    const sponsors = await Sponsor.find({ verificationStatus: 'verified' })
      .populate('userId', 'name email avatar');

    if (sponsors.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No verified sponsors found in the database.'
      });
    }

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash or gemini-2.5-flash depending on SDK, let's use gemini-1.5-flash as it is highly supported in standard versions
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' } 
        });

        const prompt = `
          You are an AI Sponsor Matching assistant for "EventSphere", a premium college event hosting platform.
          Your task is to analyze an event's details and rank our active corporate sponsors by how well their target interests, industry, and budget match this event.
          
          EVENT DETAILS:
          - Title: "${eventTitle}"
          - Category: "${category}" (e.g. Hackathon, Workshop, Seminar, Cultural)
          - Expected Audience Size: ${audienceSize} students
          - Tags/Themes: [${(tags || []).join(', ')}]
          
          CORPORATE SPONSORS AVAILABLE:
          ${JSON.stringify(sponsors.map(s => ({
            id: s._id,
            companyName: s.companyName,
            industry: s.industry,
            budgetRange: s.budgetRange,
            interests: s.interests,
            previousEvents: s.previousEvents
          })), null, 2)}
          
          INSTRUCTIONS:
          1. Evaluate each sponsor and assign a match score between 0 and 100.
          2. High scores should go to sponsors whose "interests" match the event's category/tags, or whose "industry" fits the themes (e.g., Tech companies sponsoring Hackathons).
          3. Provide a clear, professional 1-2 sentence "reason" justifying the match.
          4. Return ONLY a valid JSON array of objects. Do not include markdown code block syntax (like \`\`\`json) or any conversational text.
          
          EXPECTED JSON RESPONSE FORMAT:
          [
            {
              "sponsorId": "string (the sponsor's id)",
              "score": 92,
              "reason": "Sponsor's focus on tech fits this Hackathon perfectly. Their budget also supports the expected audience size."
            }
          ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // Parse results
        let matchedData = JSON.parse(responseText);

        // Merge complete Sponsor model data with scores
        const enrichedMatches = matchedData.map(match => {
          const originalSponsor = sponsors.find(s => s._id.toString() === match.sponsorId.toString());
          if (originalSponsor) {
            return {
              sponsor: originalSponsor,
              score: match.score,
              reason: match.reason
            };
          }
          return null;
        }).filter(item => item !== null)
          .sort((a, b) => b.score - a.score);

        return res.json({
          success: true,
          data: enrichedMatches,
          message: 'AI recommendations generated successfully via Gemini AI'
        });

      } catch (geminiError) {
        console.error('Gemini AI failed, using fallback heuristic:', geminiError);
        // Fall through to heuristic if API errors out
      }
    }

    // --- FALLBACK HEURISTIC MATCHING ---
    // Perform robust keyword-based similarity matching in JavaScript
    const eventTagsUpper = (tags || []).map(t => t.toUpperCase());
    eventTagsUpper.push(category.toUpperCase());
    eventTagsUpper.push(eventTitle.toUpperCase());

    const enrichedMatches = sponsors.map(sponsor => {
      let score = 50; // Starting baseline
      const reasons = [];

      // 1. Industry matching
      const ind = sponsor.industry.toUpperCase();
      if (category.toUpperCase() === 'HACKATHON' && (ind.includes('TECH') || ind.includes('SOFTWARE') || ind.includes('IT'))) {
        score += 25;
        reasons.push(`${sponsor.companyName} is in the technology sector, making them an excellent fit for Hackathons.`);
      } else if (category.toUpperCase() === 'WORKSHOP' && (ind.includes('EDU') || ind.includes('CONSULTING'))) {
        score += 15;
        reasons.push(`Their industry matches workshops and educational training sessions.`);
      }

      // 2. Interest tag matching
      const interestMatches = sponsor.interests.filter(interest => 
        eventTagsUpper.some(tag => tag.includes(interest.toUpperCase()) || interest.toUpperCase().includes(tag))
      );

      if (interestMatches.length > 0) {
        score += Math.min(25, interestMatches.length * 10);
        reasons.push(`Matches their specified interests: ${interestMatches.join(', ')}.`);
      }

      // 3. Audience Size / Budget alignment
      const budgetLower = sponsor.budgetRange.toLowerCase();
      if (audienceSize > 500 && budgetLower.includes('10,000') || budgetLower.includes('high')) {
        score += 15;
        reasons.push(`Their high budget aligns well with your large expected turnout of ${audienceSize} participants.`);
      } else if (audienceSize <= 200 && budgetLower.includes('1,000') || budgetLower.includes('5,000')) {
        score += 10;
        reasons.push(`Good alignment for boutique/niche turnouts.`);
      }

      // Cap score at 98 (leave room for perfect AI matching)
      score = Math.min(98, score);

      const finalReason = reasons.length > 0 
        ? reasons.join(' ') 
        : `${sponsor.companyName} has an active interest in supporting student-led college activities.`;

      return {
        sponsor,
        score,
        reason: finalReason
      };
    }).sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: enrichedMatches,
      message: 'Recommendations generated successfully via Matching Heuristic'
    });

  } catch (error) {
    next(error);
  }
};

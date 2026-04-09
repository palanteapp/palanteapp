/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ChatMessage } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = {
    /**
     * Check if OpenAI is configured
     */
    isConfigured(): boolean {
        return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
    },

    /**
     * Generate a personalized daily wisdom/quote
     */
    async generateDailyWisdom(
        userName: string,
        profession: string,
        currentMood: string,
        focusGoal: string
    ): Promise<{ text: string; author: string }> {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API Key is missing');
        }

        const prompt = `
            You are a wise, empathetic, and world-class life coach. 
            The user, ${userName}, is a ${profession} feeling ${currentMood} today.
            Their main focus is: "${focusGoal}".

            Generate a short, powerful, and personalized piece of wisdom or affirmation for them today.
            It should feel like a "quote" but tailored specifically to their context.
            
            Return ONLY a JSON object: { "text": "The wisdom text...", "author": "Palante Coach" }
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const content = data.choices[0].message.content;
            // Clean up code blocks if present
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        } catch (error) {
            console.error('OpenAI Error:', error);
            // Fallback
            return {
                text: "Consistency is not about perfection, it's about simply not giving up.",
                author: "Palante Coach (Offline)"
            };
        }
    },

    /**
     * Chat with the Palante Coach
     */
    async chat(messages: ChatMessage[], userContext: any): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API Key is missing');
        }

        const systemPrompt = `
            You are "Palante", a warm, encouraging, and highly effective accountability coach.
            
            User Context:
            - Name: ${userContext.name}
            - Profession: ${userContext.profession}
            - Current Streak: ${userContext.streak} days
            - Focus Goal: ${userContext.focusGoal}
            
            Your Style:
            - Complete brevity. Be concise. Avoid long paragraphs.
            - Warm but firm. You are here to help them move FORWARD ("pa'lante").
            - Use emojis sparingly but effectively.
            - If they seem stuck, offer a tiny, 2-minute micro-step they can take right now.
        `;

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.text }))
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI Chat Error:', error);
            return "I'm having trouble connecting to my brain right now. Please check your internet connection or API key.";
        }
    }
};

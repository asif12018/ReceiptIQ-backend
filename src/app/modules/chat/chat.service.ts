import { groqJSON, groqComplete } from "../../utils/groq";
import { prisma } from "../../../app";
import { ReceiptService } from "../receipt/receipt.service";
import { GoalService } from "../goal/goal.service";
import { UserService } from "../user/user.service";

export const ChatService = {
  chatWithBot: async (userId: string, userMessage: string) => {
    // Fetch user context for personalized responses
    const goals = await prisma.goal.findMany({ where: { userId, status: "IN_PROGRESS" } });
    const receipts = await prisma.receipt.findMany({ 
      where: { userId }, 
      take: 20, 
      orderBy: { createdAt: 'desc' } 
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    // Step 1: Intent Recognition
    const intentPrompt = `Analyze the user's message and determine the intent.
The message could be in English, Bengali, or Benglish.
Possible Intents:
1. TRANSACTION_LOGGING (e.g., "Spent 500 on lunch today")
2. SET_GOAL (e.g., "Set a goal to save 1.5 Lakh for a bike by next year")
3. SET_BUDGET (e.g., "My monthly budget is now 25,000 Taka")
4. FINANCIAL_QUERY (e.g., "How much did I spend on food this week?")
5. UPDATE_FINANCIAL_PROFILE (e.g., "I just got a job as a Software Engineer making 60k")
6. GENERAL_CHAT (e.g., "Hello", "How are you?")

Return ONLY a strict JSON object with these keys:
- intent: (one of the 6 intents above)
- extractedData: (an object with extracted parameters based on the intent)
  - for TRANSACTION_LOGGING: amount (number), category (string), merchantName (string, optional)
  - for SET_GOAL: targetAmount (number), title (string), targetDate (ISO string)
  - for SET_BUDGET: amount (number)
  - for UPDATE_FINANCIAL_PROFILE: occupation (string, must be one of: STUDENT, SOFTWARE_ENGINEER, FREELANCER, OTHER), monthlyIncome (number)
  - for others, can be empty {}

User's message: "${userMessage}"`;

    let parsedIntent: any;
    try {
      parsedIntent = await groqJSON(intentPrompt);
    } catch (e) {
      parsedIntent = { intent: "GENERAL_CHAT", extractedData: {} };
    }

    const { intent, extractedData } = parsedIntent;

    // Step 2: Route to Module
    if (intent === "TRANSACTION_LOGGING") {
      await ReceiptService.parseVoice(userMessage, userId);
      return "I have successfully logged your transaction.";
    }

    if (intent === "SET_GOAL") {
      if (extractedData.title && extractedData.targetAmount && extractedData.targetDate) {
        await GoalService.createGoal(userId, {
          title: extractedData.title,
          targetAmount: extractedData.targetAmount,
          targetDate: extractedData.targetDate,
          dailyBudgetCap: null
        });
        return `Goal for "${extractedData.title}" set to ${extractedData.targetAmount} by ${new Date(extractedData.targetDate).toLocaleDateString()}.`;
      }
    }

    if (intent === "SET_BUDGET") {
      if (extractedData.amount) {
        await UserService.updateBudget(userId, extractedData.amount);
        return `Your monthly budget has been updated to ${extractedData.amount}.`;
      }
    }

    if (intent === "UPDATE_FINANCIAL_PROFILE") {
      if (extractedData.occupation || extractedData.monthlyIncome) {
        const dataToUpdate: any = {};
        if (extractedData.occupation) dataToUpdate.occupation = extractedData.occupation;
        if (extractedData.monthlyIncome) dataToUpdate.monthlyIncome = extractedData.monthlyIncome;
        
        await prisma.user.update({
          where: { id: userId },
          data: dataToUpdate
        });
        return `Your financial profile has been updated automatically.`;
      }
    }

    // Default & Financial Query Handler
    const replyPrompt = `${systemPrompt}
User's Intent was identified as: ${intent}.
User's message: "${userMessage}"
Context:
- Active Goals: ${JSON.stringify(goals)}
- Recent Expenses: ${JSON.stringify(receipts)}
- Monthly Budget: ${user?.monthlyBudget || "Not set"}

Respond to the user directly, answering their query based on the context provided. Use Markdown.`;

    return await groqComplete(replyPrompt);
  }
};

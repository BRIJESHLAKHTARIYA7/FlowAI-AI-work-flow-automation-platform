import dotenv from 'dotenv';
dotenv.config();

// Supported step schema validator
export function validateWorkflowSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('Workflow must contain at least one step.');
  }

  const validTypes = ['trigger', 'condition', 'task', 'wait', 'message'];

  return steps.map((step, idx) => {
    if (!step || typeof step !== 'object') {
      throw new Error(`Step at index ${idx} is not a valid object.`);
    }

    const type = String(step.type || '').toLowerCase();
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid step type "${step.type}" at step ${idx + 1}. Valid types: ${validTypes.join(', ')}`);
    }

    const normalized = {
      id: step.id || `step-${idx + 1}-${Date.now().toString(36)}`,
      type,
      name: step.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Step ${idx + 1}`,
      ...step
    };

    if (type === 'condition') {
      if (!normalized.field) normalized.field = 'amount';
      if (!normalized.operator) normalized.operator = 'greater_than';
      if (normalized.value === undefined) normalized.value = 500;
    } else if (type === 'wait') {
      normalized.duration_seconds = parseInt(normalized.duration_seconds || 10, 10);
    } else if (type === 'message') {
      normalized.content = normalized.content || 'Thank you for your order! We are processing your request.';
    } else if (type === 'task') {
      normalized.action = normalized.action || 'calculate_discount';
    }

    return normalized;
  });
}

// Robust rule-based natural language parser fallback
export function parseWithRuleEngine(promptText) {
  const text = promptText.trim();
  const lower = text.toLowerCase();

  let name = 'Automated Workflow';
  let trigger = {
    type: 'order_received',
    name: 'New order received',
    sample_input: {
      order_id: 'ORD-1001',
      customer_name: 'John Doe',
      email: 'john@example.com',
      amount: 600
    }
  };

  const steps = [];
  let stepIndex = 1;

  // 1. Detect trigger
  if (lower.includes('order') || lower.includes('purchase')) {
    name = 'Order Automation Workflow';
    trigger = {
      type: 'order_received',
      name: 'New order received',
      sample_input: { order_id: 'ORD-' + Math.floor(1000 + Math.random() * 9000), amount: 650, email: 'customer@example.com' }
    };
  } else if (lower.includes('user') || lower.includes('signup') || lower.includes('registered')) {
    name = 'User Onboarding Workflow';
    trigger = {
      type: 'user_signup',
      name: 'New user registered',
      sample_input: { user_id: 'USR-204', email: 'user@example.com', tier: 'pro', score: 85 }
    };
  }

  // 2. Detect Condition
  // Matches e.g. "if the amount is greater than 500" or "amount > 500" or "score is less than 30"
  const condMatch = text.match(/(?:if|when|where)\s+(?:the\s+)?([a-zA-Z_]+)\s+(?:is\s+)?(greater than|more than|>|less than|<|equals?|==|>=|<=|contains)\s+['"]?([^,\.;\s]+)['"]?/i);
  if (condMatch) {
    const rawField = condMatch[1].toLowerCase();
    const rawOp = condMatch[2].toLowerCase();
    const rawVal = condMatch[3];

    let operator = 'equals';
    if (rawOp.includes('greater') || rawOp.includes('more') || rawOp === '>') operator = 'greater_than';
    else if (rawOp.includes('less') || rawOp === '<') operator = 'less_than';
    else if (rawOp.includes('contain')) operator = 'contains';
    else if (rawOp === '>=' || rawOp.includes('>=')) operator = 'greater_than_or_equal';
    else if (rawOp === '<=' || rawOp.includes('<=')) operator = 'less_than_or_equal';

    const numVal = Number(rawVal);
    const value = !isNaN(numVal) ? numVal : rawVal;

    steps.push({
      id: `step-${stepIndex++}`,
      type: 'condition',
      name: `Check if ${rawField} ${operator} ${value}`,
      field: rawField,
      operator,
      value
    });
  } else if (lower.includes('amount') && (lower.includes('500') || lower.includes('100') || lower.includes('1000'))) {
    // Default fallback condition
    const amtMatch = text.match(/\b(\d+)\b/);
    const targetAmt = amtMatch ? Number(amtMatch[1]) : 500;
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'condition',
      name: `Check if amount > ${targetAmt}`,
      field: 'amount',
      operator: 'greater_than',
      value: targetAmt
    });
  }

  // 3. Detect Task (discount, invoice, calculation)
  if (lower.includes('discount') || lower.includes('calculate discount')) {
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'task',
      name: 'Calculate Customer Discount',
      action: 'calculate_discount',
      discount_rate: 0.15
    });
  } else if (lower.includes('invoice') || lower.includes('generate invoice')) {
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'task',
      name: 'Generate Draft Invoice',
      action: 'generate_invoice'
    });
  }

  // 4. Detect Wait Step
  // Matches "wait 10 seconds" or "wait 5 minutes" or "pause for 15s"
  const waitMatch = text.match(/(?:wait|pause|delay)\s+(?:for\s+)?(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m)/i);
  if (waitMatch) {
    const rawNum = parseInt(waitMatch[1], 10);
    const unit = waitMatch[2].toLowerCase();
    const duration = unit.startsWith('m') ? rawNum * 60 : rawNum;
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'wait',
      name: `Wait ${rawNum} ${unit}`,
      duration_seconds: duration
    });
  } else if (lower.includes('wait') || lower.includes('pause')) {
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'wait',
      name: 'Wait 10 seconds',
      duration_seconds: 10
    });
  }

  // 5. Detect Message Step
  // Matches "send a follow-up message" or "send message: ..."
  let messageContent = 'Thank you for your high-value order! We will follow up shortly.';
  const msgContentMatch = text.match(/(?:message|email|notification|text)\s*(?:saying|content|with|:)\s*["']?([^"'\n\.]+)["']?/i);
  if (msgContentMatch && msgContentMatch[1].trim().length > 3) {
    messageContent = msgContentMatch[1].trim();
  } else if (lower.includes('thank')) {
    messageContent = 'Thank you for your order! Your request has been approved.';
  }

  if (lower.includes('message') || lower.includes('email') || lower.includes('notify') || lower.includes('send')) {
    steps.push({
      id: `step-${stepIndex++}`,
      type: 'message',
      name: 'Send Customer Notification',
      content: messageContent
    });
  }

  // If no steps generated, provide a default 3-step pipeline matching the input
  if (steps.length === 0) {
    steps.push(
      {
        id: `step-1`,
        type: 'condition',
        name: 'Check Order Amount (> 500)',
        field: 'amount',
        operator: 'greater_than',
        value: 500
      },
      {
        id: `step-2`,
        type: 'wait',
        name: 'Wait 10 Seconds',
        duration_seconds: 10
      },
      {
        id: `step-3`,
        type: 'message',
        name: 'Send Follow-up Message',
        content: 'Thank you for your high-value order! We will follow up shortly.'
      }
    );
  }

  return {
    name,
    description: `Generated from prompt: "${promptText.slice(0, 100)}"`,
    trigger_config: trigger,
    steps,
    source: 'rule_based'
  };
}

// AI workflow generation via Google Gemini API with fallback
export async function generateWorkflowFromNaturalLanguage(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.log('[AI] GEMINI_API_KEY not configured. Using rule-based natural language parser.');
    const result = parseWithRuleEngine(promptText);
    return {
      ...result,
      source: 'rule_based',
      aiConfigured: false,
      steps: validateWorkflowSteps(result.steps)
    };
  }

  try {
    console.log('[AI] Generating workflow using Google Gemini API...');
    const systemPrompt = `You are an expert AI workflow engine compiler. 
Given a natural language description of an automated workflow, parse it into structured JSON matching this schema:
{
  "name": "Concise workflow name",
  "description": "Brief description of what this workflow does",
  "trigger_config": {
    "type": "order_received",
    "name": "New order received",
    "sample_input": { "amount": 600, "customer": "John Doe", "email": "john@example.com" }
  },
  "steps": [
    // Array of steps. Supported step types:
    // 1. "condition": { "type": "condition", "name": "...", "field": "amount", "operator": "greater_than" | "less_than" | "equals" | "contains", "value": 500 }
    // 2. "task": { "type": "task", "name": "...", "action": "calculate_discount" | "generate_invoice" | "custom", "config": {} }
    // 3. "wait": { "type": "wait", "name": "...", "duration_seconds": 10 }
    // 4. "message": { "type": "message", "name": "...", "content": "..." }
  ]
}

Return ONLY valid raw JSON with NO markdown formatting, NO backticks, NO explanations.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: `User workflow description: "${promptText}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI] Gemini API returned error ${response.status}: ${errText}. Falling back to rule parser.`);
      const fallback = parseWithRuleEngine(promptText);
      return {
        ...fallback,
        source: 'rule_based_fallback',
        aiConfigured: true,
        aiError: `Gemini API returned status ${response.status}`,
        steps: validateWorkflowSteps(fallback.steps)
      };
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned empty response content.');
    }

    // Clean JSON markdown fences if present
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      name: parsed.name || 'AI Generated Workflow',
      description: parsed.description || promptText,
      trigger_config: parsed.trigger_config || { type: 'manual', name: 'Manual Trigger' },
      steps: validateWorkflowSteps(parsed.steps),
      source: 'gemini',
      aiConfigured: true
    };
  } catch (err) {
    console.warn(`[AI] Error during Gemini API invocation: ${err.message}. Falling back to rule engine.`);
    const fallback = parseWithRuleEngine(promptText);
    return {
      ...fallback,
      source: 'rule_based_fallback',
      aiConfigured: true,
      aiError: err.message,
      steps: validateWorkflowSteps(fallback.steps)
    };
  }
}

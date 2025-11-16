# Interview Components

This project now includes 3 different React interview components you can choose from.

## Components Overview

### 1. App.jsx (Original)
**Full-featured dynamic interview interface**
- ✅ Already existing component
- Dynamic question flow with expandable cards
- Progress tracking in sidebar
- AI follow-up questions simulation
- Insight extraction (Desire, Barrier, Action)
- Smooth animations and transitions
- Black theme design

### 2. SimpleInterview.jsx (NEW)
**Simple static layout based on index2.html**
- 📄 Converted from `index2.html`
- Clean, minimal interface
- Single active question view
- Chat-style conversation display
- Insight tags display
- Collapsed view for other questions
- Basic input with Enter key support
- Black theme (`#0B0C0F` background)

**Use case**: When you need a simpler, more straightforward interview UI without complex state management.

### 3. InterviewApp.jsx (NEW)
**Alternative full-featured interview**
- 🔄 Similar to App.jsx but restructured
- Full dynamic question flow
- Progress bar with completion tracking
- AI typing indicators
- Follow-up question system
- Insight schema display
- Expandable/collapsible cards
- Completion message
- Black theme design

**Use case**: Alternative implementation with slightly different structure, useful for A/B testing or different use cases.

## How to Switch Between Components

Edit `src/main.jsx` and change the `ComponentToRender` constant:

```javascript
// Option 1: Original component
const ComponentToRender = App;

// Option 2: Simple static layout
const ComponentToRender = SimpleInterview;

// Option 3: Alternative full-featured
const ComponentToRender = InterviewApp;
```

## Design System (All Components)

### Black Theme Colors
- **Background**: `#0B0C0F` - Main dark background
- **Sidebar**: `#101114` - Slightly lighter sidebar
- **Card**: `#181A1F` - Card background
- **Card Hover**: `#1F2228` - Card hover state
- **Border**: `#26282D` - Subtle borders
- **Input Background**: `#1C1E23` - Input fields
- **Text**: `#D0D2D6` - Primary text
- **Text Muted**: `#6E7176` - Secondary text

### Status Colors
- **Active**: Blue (`#3B82F6`)
- **Completed**: Green
- **Pending**: Gray

### Typography
- **Font**: Kanit (Thai) with system fallbacks
- **Weights**: 300, 400, 500, 600, 700

## Features Comparison

| Feature | App.jsx | SimpleInterview.jsx | InterviewApp.jsx |
|---------|---------|---------------------|------------------|
| Dynamic Questions | ✅ | ❌ | ✅ |
| Progress Tracking | ✅ | ❌ | ✅ |
| AI Follow-ups | ✅ | ❌ | ✅ |
| Expandable Cards | ✅ | ❌ | ✅ |
| Chat Interface | ✅ | ✅ | ✅ |
| Insight Display | ✅ | ✅ | ✅ |
| Typing Indicator | ✅ | ❌ | ✅ |
| Completion Message | ✅ | ❌ | ✅ |
| Complexity | Medium | Low | Medium |

## Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Customization

### Adding Questions
Edit the `questions` array in each component:

```javascript
const questions = [
  {
    id: 'q1',
    category: 'CATEGORY_NAME',
    text: 'Your question text here?',
    followUpTemplates: [
      'Follow-up question 1?',
      'Follow-up question 2?'
    ]
  },
  // ... more questions
];
```

### Modifying Insights
Edit the `insightExamples` array:

```javascript
const insightExamples = [
  {
    desire: 'What the user wants',
    barrier: 'What prevents them',
    action: 'What they do about it'
  },
  // ... more insights
];
```

## Integration with Backend

To connect with a real backend API:

1. Replace sample data with API calls
2. Add WebSocket for real-time AI responses
3. Implement authentication
4. Store answers and insights in database
5. Add session management

Example API integration:

```javascript
// Fetch questions from API
const fetchQuestions = async () => {
  const response = await fetch('/api/questions');
  const data = await response.json();
  setQuestions(data);
};

// Submit answer to API
const submitAnswer = async (questionId, answer) => {
  await fetch('/api/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, answer })
  });
};
```

## Dependencies

- React 18+
- lucide-react (for icons in App.jsx and InterviewApp.jsx)
- Tailwind CSS (configured in tailwind.config.js)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

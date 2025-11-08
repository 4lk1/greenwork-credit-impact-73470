# GreenWorks CodeX

**A sustainability-focused web app for the International hAIckathon**

Team: **CodeX** | Hub: **TechSpace Tirana**

---

## 🌍 What is GreenWorks CodeX?

GreenWorks CodeX connects people in climate-vulnerable or low-income communities across Europe with **climate-resilience micro-jobs**. Users can:

- **Discover** simple green-economy opportunities (tree planting, solar maintenance, water harvesting, etc.)
- **Learn** through interactive training modules with quizzes
- **Track** both economic rewards (credits) and environmental impact (estimated CO₂ offset)

---

## 🎯 Project Goal

Help communities access meaningful climate work while building skills and earning income. Each completed micro-job contributes to:
- **Economic benefit**: Earn credits for completed work
- **Climate impact**: Track estimated CO₂ reductions and resilience improvements
- **Skill development**: Learn through structured training and assessments

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL
- **Charts**: Recharts
- **Routing**: React Router v6

---

## 📊 Data Models

### Users
- Basic profile information and location

### Micro Jobs
- Title, description, category, difficulty level
- Duration, reward credits, CO₂ impact estimate
- Location and active status

### Training Modules
- Structured learning content for each job
- Learning objectives and safety guidelines

### Quiz Questions
- Multiple-choice questions to assess learning
- Correct answer tracking

### Job Completions
- User progress tracking
- Quiz scores, earned credits, CO₂ impact

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended: install with [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-directory>

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

---

## 📱 App Features

### Home Page
- Clear value proposition and mission statement
- Quick access to browse jobs and view impact
- Statistics showcasing available opportunities

### Micro-Jobs Browser
- Filter by category (tree planting, solar maintenance, water harvesting, agroforestry, home insulation)
- Filter by difficulty level (beginner, intermediate, advanced)
- View job details including location, duration, rewards, and CO₂ impact

### Job Detail & Training
- Complete job description and requirements
- Interactive training module with comprehensive content
- Quiz with instant feedback (70% required to pass)
- Job completion flow with reward confirmation

### Impact Dashboard
- Aggregate statistics: total jobs, credits, CO₂ offset, average quiz score
- Visual charts showing impact by category
- Timeline of credits earned
- Recent completion history

---

## 🌱 Seed Data

The app comes pre-loaded with:
- **10 diverse micro-jobs** across 5 categories
- Jobs located in various European cities (Tirana, Athens, Rome, Barcelona, Paris, etc.)
- **Training modules** with detailed learning content
- **Quiz questions** (3-5 per job) with correct answers

Categories included:
- 🌳 **Tree Planting**: Urban and mountain reforestation
- ☀️ **Solar Maintenance**: Panel cleaning and system maintenance
- 💧 **Water Harvesting**: Rainwater systems and bioswales
- 🌾 **Agroforestry**: Food forests and orchards
- 🏠 **Home Insulation**: Energy-efficient upgrades

---

## 🎨 Design System

The app uses a **sustainability-focused design** with:
- **Primary color**: Fresh emerald green (#10b981)
- **Secondary colors**: Earth tones and sky blues
- **Semantic tokens**: All colors defined in design system (no hardcoded values)
- **Responsive design**: Mobile-first approach
- **Accessibility**: Semantic HTML and ARIA labels

---

## 🔐 Authentication & Security

- Currently configured for **demo mode** (no authentication required)
- Row-Level Security (RLS) policies enabled on all tables
- Public read access for browsing
- Public write access for job completions (demo purposes)

For production deployment, implement proper user authentication.

---

## 📈 Future Enhancements

- User authentication and personal profiles
- Real-time job availability based on location
- Community features and social sharing
- Integration with payment systems for credits
- Mobile app version
- Multi-language support
- Advanced impact metrics and certifications

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! Areas for improvement:
- Additional micro-job categories
- Enhanced training content
- More sophisticated impact calculations
- User onboarding improvements
- Accessibility enhancements

---

## 📄 License

Built for the International hAIckathon 2025

---

## 🙏 Acknowledgments

- **TechSpace Tirana** for hosting
- **International hAIckathon** organizers
- Open-source community for amazing tools and libraries

---

## 📞 Contact

**Team CodeX**  
TechSpace Tirana Hub

For questions or feedback about GreenWorks CodeX, please reach out through the hackathon channels.

---

**Built with 💚 for a sustainable future**

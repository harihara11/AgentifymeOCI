window.OCI_AI_FACTORY_WORKBOOK = {
  "generatedFrom": "oci_ai_factory_final_workbook.xlsx",
  "generatedAt": "2026-06-13T19:20:53.070Z",
  "requiredTabs": [
    "01_README",
    "02_Personas",
    "03_Agent_Patterns",
    "04_Knowledge_Sources",
    "05_Persona_Pattern_KB_Map",
    "06_Experience_Rules",
    "07_Persona_Pattern_Scenarios",
    "08_Scenario_QnA",
    "09_Sample_Responses",
    "10_Blueprint_Map",
    "11_Content_Repository_Map",
    "12_Leaderboard_Config"
  ],
  "sheets": {
    "01_README": [
      {
        "OCI AI Factory - Final Workbook": "Purpose"
      },
      {
        "OCI AI Factory - Final Workbook": "Explore mode"
      },
      {
        "OCI AI Factory - Final Workbook": "Engineer mode"
      },
      {
        "OCI AI Factory - Final Workbook": "Scenario key"
      },
      {
        "OCI AI Factory - Final Workbook": "Repository"
      },
      {
        "OCI AI Factory - Final Workbook": "Scenario count"
      }
    ],
    "02_Personas": [
      {
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "Description": "HR operations, employee support, policies, and workforce programs",
        "RecommendedPatternID": "AP01"
      },
      {
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "Description": "Financial analysis, cost control, planning, and controls",
        "RecommendedPatternID": "AP02"
      },
      {
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "Description": "Customer service, case handling, and sentiment analysis",
        "RecommendedPatternID": "AP04"
      }
    ],
    "03_Agent_Patterns": [
      {
        "PatternID": "AP01",
        "PatternName": "RAG",
        "Description": "Retrieval Augmented Generation for policy and knowledge retrieval"
      },
      {
        "PatternID": "AP02",
        "PatternName": "NLSQL",
        "Description": "Natural language to SQL over structured datasets"
      },
      {
        "PatternID": "AP03",
        "PatternName": "Document AI",
        "Description": "OCR and document understanding for files and forms"
      },
      {
        "PatternID": "AP04",
        "PatternName": "Cognitive",
        "Description": "Audio/video intelligence and multimodal analysis"
      }
    ],
    "04_Knowledge_Sources": [
      {
        "KnowledgeID": "KS01",
        "PatternID": "AP01",
        "KnowledgeSource": "HR Policy Repository",
        "SourceType": "PDF/DOCX policy pack",
        "Description": "Policy docs, playbooks, SOPs",
        "Channel": "Doc/Email/Slack",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS02",
        "PatternID": "AP01",
        "KnowledgeSource": "HR SharePoint Portal",
        "SourceType": "Site pages and working docs",
        "Description": "Team sites, guidance pages, FAQs",
        "Channel": "Doc/Email/Slack",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS03",
        "PatternID": "AP01",
        "KnowledgeSource": "HR Jira Knowledge Base",
        "SourceType": "Issue history and runbooks",
        "Description": "Common HR process issues and fixes",
        "Channel": "Jira",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS04",
        "PatternID": "AP01",
        "KnowledgeSource": "HR Email Archive",
        "SourceType": "Shared mailbox examples",
        "Description": "Prior HR responses and approvals",
        "Channel": "Email",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS05",
        "PatternID": "AP01",
        "KnowledgeSource": "HR Slack Channel",
        "SourceType": "Collaboration thread samples",
        "Description": "Chat threads and policy clarifications",
        "Channel": "Slack",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS06",
        "PatternID": "AP01",
        "KnowledgeSource": "HR SOP Repository",
        "SourceType": "Standard operating procedures",
        "Description": "Step-by-step HR workflows",
        "Channel": "Doc",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS07",
        "PatternID": "AP01",
        "KnowledgeSource": "Employee Handbook",
        "SourceType": "General employee handbook",
        "Description": "Benefits and leave guidance",
        "Channel": "Doc",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS08",
        "PatternID": "AP02",
        "KnowledgeSource": "Employee Master Dataset",
        "SourceType": "Worker master and demographics",
        "Description": "Headcount and workforce attributes",
        "Channel": "CSV",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS09",
        "PatternID": "AP02",
        "KnowledgeSource": "Payroll Dataset",
        "SourceType": "Payroll transactions and earnings",
        "Description": "Salary, overtime, deductions",
        "Channel": "CSV",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS10",
        "PatternID": "AP02",
        "KnowledgeSource": "Workforce Planning Dataset",
        "SourceType": "Forecast and capacity planning",
        "Description": "Future workforce demand and supply",
        "Channel": "CSV",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS11",
        "PatternID": "AP02",
        "KnowledgeSource": "Recruiting Analytics Dataset",
        "SourceType": "Hiring funnel and time-to-fill",
        "Description": "Candidate pipeline and conversion",
        "Channel": "CSV",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS12",
        "PatternID": "AP02",
        "KnowledgeSource": "Learning Dataset",
        "SourceType": "Training completion data",
        "Description": "Learning assignments and progress",
        "Channel": "CSV",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS13",
        "PatternID": "AP02",
        "KnowledgeSource": "Performance Dataset",
        "SourceType": "Performance ratings and goals",
        "Description": "Performance outcomes and trends",
        "Channel": "CSV",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS14",
        "PatternID": "AP03",
        "KnowledgeSource": "Invoice Repository",
        "SourceType": "Invoice PDF samples",
        "Description": "Extract invoice data and totals",
        "Channel": "PDF",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS15",
        "PatternID": "AP03",
        "KnowledgeSource": "Contract Repository",
        "SourceType": "Contract document samples",
        "Description": "Clauses, dates, terms",
        "Channel": "PDF/DOCX",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS16",
        "PatternID": "AP03",
        "KnowledgeSource": "Purchase Orders",
        "SourceType": "PO samples",
        "Description": "Purchase order metadata and line items",
        "Channel": "PDF",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS17",
        "PatternID": "AP03",
        "KnowledgeSource": "Vendor Agreements",
        "SourceType": "Vendor contract samples",
        "Description": "Obligations and renewal dates",
        "Channel": "PDF/DOCX",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS18",
        "PatternID": "AP03",
        "KnowledgeSource": "Employee Forms",
        "SourceType": "Forms and declarations",
        "Description": "Employee form extraction",
        "Channel": "PDF",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS19",
        "PatternID": "AP03",
        "KnowledgeSource": "Expense Reports",
        "SourceType": "Expense claim samples",
        "Description": "Reimbursement and approval data",
        "Channel": "PDF",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS20",
        "PatternID": "AP04",
        "KnowledgeSource": "Call Center Audio Library",
        "SourceType": "Call recordings",
        "Description": "Audio for sentiment, escalation, and intent",
        "Channel": "Audio",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS21",
        "PatternID": "AP04",
        "KnowledgeSource": "Customer Transcript Library",
        "SourceType": "Transcribed calls/chats",
        "Description": "Text transcripts for analysis",
        "Channel": "TXT/CSV",
        "DefaultRecommended": "Y"
      },
      {
        "KnowledgeID": "KS22",
        "PatternID": "AP04",
        "KnowledgeSource": "Voice Sentiment Samples",
        "SourceType": "Labeled emotion clips",
        "Description": "Sentiment classification examples",
        "Channel": "Audio",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS23",
        "PatternID": "AP04",
        "KnowledgeSource": "Drone Inspection Videos",
        "SourceType": "Drone inspection clips",
        "Description": "Anomaly and object detection",
        "Channel": "Video",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS24",
        "PatternID": "AP04",
        "KnowledgeSource": "CCTV Incident Videos",
        "SourceType": "Security footage samples",
        "Description": "Incident detection and review",
        "Channel": "Video",
        "DefaultRecommended": "N"
      },
      {
        "KnowledgeID": "KS25",
        "PatternID": "AP04",
        "KnowledgeSource": "Escalation Recording Library",
        "SourceType": "Customer escalation calls",
        "Description": "High-priority call examples",
        "Channel": "Audio",
        "DefaultRecommended": "N"
      }
    ],
    "05_Persona_Pattern_KB_Map": [
      {
        "PersonaID": "P01",
        "PatternID": "AP01",
        "KnowledgeID": "KS01",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP01",
        "KnowledgeID": "KS02",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP01",
        "KnowledgeID": "KS04",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP01",
        "KnowledgeID": "KS05",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP01",
        "KnowledgeID": "KS06",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP02",
        "KnowledgeID": "KS08",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP02",
        "KnowledgeID": "KS10",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP02",
        "KnowledgeID": "KS12",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP02",
        "KnowledgeID": "KS13",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP03",
        "KnowledgeID": "KS15",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP03",
        "KnowledgeID": "KS18",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP03",
        "KnowledgeID": "KS19",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP04",
        "KnowledgeID": "KS20",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP04",
        "KnowledgeID": "KS21",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P01",
        "PatternID": "AP04",
        "KnowledgeID": "KS22",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP01",
        "KnowledgeID": "KS02",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP01",
        "KnowledgeID": "KS03",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP01",
        "KnowledgeID": "KS04",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP01",
        "KnowledgeID": "KS07",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP02",
        "KnowledgeID": "KS08",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP02",
        "KnowledgeID": "KS09",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP02",
        "KnowledgeID": "KS10",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP02",
        "KnowledgeID": "KS11",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP02",
        "KnowledgeID": "KS13",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP03",
        "KnowledgeID": "KS14",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP03",
        "KnowledgeID": "KS15",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP03",
        "KnowledgeID": "KS16",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP03",
        "KnowledgeID": "KS17",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP03",
        "KnowledgeID": "KS19",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP04",
        "KnowledgeID": "KS20",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP04",
        "KnowledgeID": "KS21",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P02",
        "PatternID": "AP04",
        "KnowledgeID": "KS25",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP01",
        "KnowledgeID": "KS03",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP01",
        "KnowledgeID": "KS04",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP01",
        "KnowledgeID": "KS05",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP01",
        "KnowledgeID": "KS06",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP01",
        "KnowledgeID": "KS07",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP02",
        "KnowledgeID": "KS08",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP02",
        "KnowledgeID": "KS11",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP02",
        "KnowledgeID": "KS12",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP02",
        "KnowledgeID": "KS13",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP03",
        "KnowledgeID": "KS14",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP03",
        "KnowledgeID": "KS15",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP03",
        "KnowledgeID": "KS18",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP03",
        "KnowledgeID": "KS19",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS20",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS21",
        "DefaultSelected": "Y"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS22",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS23",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS24",
        "DefaultSelected": "N"
      },
      {
        "PersonaID": "P03",
        "PatternID": "AP04",
        "KnowledgeID": "KS25",
        "DefaultSelected": "N"
      }
    ],
    "06_Experience_Rules": [
      {
        "Experience": "Explore",
        "PatternBehavior": "Auto-select recommended pattern for persona",
        "KnowledgeSourceBehavior": "Locked knowledge sources",
        "KB Actions": "View only",
        "QuestionBehavior": "2 predefined questions",
        "Notes": "No add/remove"
      },
      {
        "Experience": "Engineer",
        "PatternBehavior": "User can select any pattern",
        "KnowledgeSourceBehavior": "Editable knowledge sources",
        "KB Actions": "Add/Remove/View",
        "QuestionBehavior": "2 predefined questions + custom question support",
        "Notes": "Full build and test"
      }
    ],
    "07_Persona_Pattern_Scenarios": [
      {
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "ScenarioTitle": "HR Specialist - RAG",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC002",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "ScenarioTitle": "HR Specialist - NLSQL",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC003",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "ScenarioTitle": "HR Specialist - Document AI",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC004",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "ScenarioTitle": "HR Specialist - Cognitive",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC005",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "ScenarioTitle": "Finance Specialist - RAG",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "ScenarioTitle": "Finance Specialist - NLSQL",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "ScenarioTitle": "Finance Specialist - Document AI",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC008",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "ScenarioTitle": "Finance Specialist - Cognitive",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "ScenarioTitle": "Call Center Agent - RAG",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC010",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "ScenarioTitle": "Call Center Agent - NLSQL",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC011",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "ScenarioTitle": "Call Center Agent - Document AI",
        "ExperienceModes": "Explore + Engineer"
      },
      {
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "ScenarioTitle": "Call Center Agent - Cognitive",
        "ExperienceModes": "Explore + Engineer"
      }
    ],
    "08_Scenario_QnA": [
      {
        "QnAID": "Q001",
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS01",
        "KnowledgeSource": "HR Policy Repository",
        "RequiredKnowledgeIDs": "KS01",
        "QuestionOrder": "1",
        "Question": "What is the maternity leave eligibility and approval process?",
        "ExpectedAnswer": "Maternity leave is available to eligible employees once the request is submitted with the expected leave dates and supporting documentation. The usual flow is: employee submits the leave request, manager reviews coverage impact, HR validates eligibility, and payroll/benefits teams confirm any pay or benefit changes. The next action is to confirm eligibility in the HR policy record and route the request for manager and HR approval.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q002",
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS02",
        "KnowledgeSource": "HR SharePoint Portal",
        "RequiredKnowledgeIDs": "KS02",
        "QuestionOrder": "2",
        "Question": "Summarize the onboarding tasks owned by HR operations.",
        "ExpectedAnswer": "HR-owned onboarding includes preparing the worker profile, confirming offer and start-date details, assigning required documents, triggering equipment/access requests, and scheduling first-week orientation. The handoff is complete when the manager confirms role readiness and HR marks all onboarding checklist items as complete.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q003",
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "QuestionOrder": "3",
        "Question": "What prior email guidance exists for employee time-off exceptions?",
        "ExpectedAnswer": "For time-off exceptions, previous HR email guidance says to document the reason, check manager coverage, confirm policy eligibility, and route exceptions to HR for approval. Employees should receive a clear response that includes whether the exception is approved, what dates are covered, and any payroll or balance impact.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q004",
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS05",
        "KnowledgeSource": "HR Slack Channel",
        "RequiredKnowledgeIDs": "KS05",
        "QuestionOrder": "4",
        "Question": "What policy clarifications were shared in HR Slack for leave exceptions?",
        "ExpectedAnswer": "The HR Slack clarification says leave exceptions should not be handled informally. HR should capture the employee context, confirm policy category, ask the manager to validate business coverage, and then record the final decision in the HR case notes so future questions use the same precedent.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q005",
        "ScenarioID": "SC001",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS06",
        "KnowledgeSource": "HR SOP Repository",
        "RequiredKnowledgeIDs": "KS06",
        "QuestionOrder": "5",
        "Question": "What SOP steps should HR follow for an employee case escalation?",
        "ExpectedAnswer": "For an HR case escalation, first capture the employee issue and urgency, then classify the case type, assign an owner, and check whether policy, payroll, legal, or manager input is required. Escalate when there is compliance risk, missed SLA, payroll impact, or employee relations sensitivity. Close the case only after the employee receives the final documented answer.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q006",
        "ScenarioID": "SC002",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "QuestionOrder": "1",
        "Question": "Show active headcount by department and worker type.",
        "ExpectedAnswer": "Active headcount can be shown by grouping the employee master records by department and worker type. The useful view is total active employees, full-time versus contingent split, and departments with unusual growth or low staffing. This helps HR identify where workforce capacity may need review.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q007",
        "ScenarioID": "SC002",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS10",
        "KnowledgeSource": "Workforce Planning Dataset",
        "RequiredKnowledgeIDs": "KS10",
        "QuestionOrder": "2",
        "Question": "Show workforce supply versus demand forecast by quarter.",
        "ExpectedAnswer": "The workforce forecast should compare planned demand with available supply for each quarter. Any quarter where demand is higher than supply should be flagged as a staffing gap. The answer should call out the largest gaps, the affected job families, and whether hiring, transfer, or contractor coverage is the recommended action.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q008",
        "ScenarioID": "SC002",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS12",
        "KnowledgeSource": "Learning Dataset",
        "RequiredKnowledgeIDs": "KS12",
        "QuestionOrder": "3",
        "Question": "Show mandatory learning completion rate by organization.",
        "ExpectedAnswer": "Mandatory learning completion should show assigned, completed, overdue, and completion percentage by organization. Groups below the target completion rate should be highlighted first, along with overdue counts and the recommended reminder or escalation action.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q009",
        "ScenarioID": "SC002",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "QuestionOrder": "4",
        "Question": "Show performance rating distribution by manager group.",
        "ExpectedAnswer": "The performance rating view should show how ratings are distributed by manager group. A balanced distribution is expected; unusually high or low clusters should be flagged for calibration review. The output should identify manager groups with rating concentration, missing reviews, or year-over-year movement.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q010",
        "ScenarioID": "SC003",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "QuestionOrder": "1",
        "Question": "Summarize employment contract obligations and renewal dates.",
        "ExpectedAnswer": "The contract summary should identify the employee or vendor party, effective date, renewal date, notice period, and major obligations. HR should focus on clauses that affect role, compensation, confidentiality, termination, and renewal actions. Any upcoming renewal or notice deadline should be flagged as a next step.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q011",
        "ScenarioID": "SC003",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS18",
        "KnowledgeSource": "Employee Forms",
        "RequiredKnowledgeIDs": "KS18",
        "QuestionOrder": "2",
        "Question": "Extract employee name, form type, dates, and approval status.",
        "ExpectedAnswer": "The employee form contains the employee identifier, form type, effective date, submitted date, approval status, and any missing required fields. If the form is incomplete, the next action is to return it to the employee or manager with the missing field list. If complete, it can move to approval or record update.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q012",
        "ScenarioID": "SC003",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "QuestionOrder": "3",
        "Question": "Extract reimbursement amount, policy category, and approval status.",
        "ExpectedAnswer": "The expense report should show the claimed amount, category, receipt status, approver, and whether the claim fits policy. Any missing receipt, late submission, duplicate amount, or out-of-policy category should be marked for review before reimbursement.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q013",
        "ScenarioID": "SC004",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "QuestionOrder": "1",
        "Question": "Analyze the HR service call for intent and employee sentiment.",
        "ExpectedAnswer": "The HR service call indicates the employee intent, current sentiment, urgency level, and recommended follow-up. If the employee sounds frustrated or the issue affects pay, benefits, or leave, the case should be prioritized and routed to the responsible HR specialist.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q014",
        "ScenarioID": "SC004",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "QuestionOrder": "2",
        "Question": "Summarize employee transcript themes and requested actions.",
        "ExpectedAnswer": "The transcript themes show what employees are asking for, the tone of the conversation, and unresolved action items. The recommended response should acknowledge the concern, confirm the next owner, and give the employee a clear timeline for resolution.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q015",
        "ScenarioID": "SC004",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS22",
        "KnowledgeSource": "Voice Sentiment Samples",
        "RequiredKnowledgeIDs": "KS22",
        "QuestionOrder": "3",
        "Question": "Classify sentiment patterns across employee voice samples.",
        "ExpectedAnswer": "The voice samples show the emotional tone and confidence of each interaction. Calls with frustration, confusion, or urgency should be flagged for follow-up. Positive calls can be used as examples for coaching and standard response improvement.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q016",
        "ScenarioID": "SC005",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS02",
        "KnowledgeSource": "HR SharePoint Portal",
        "RequiredKnowledgeIDs": "KS02",
        "QuestionOrder": "1",
        "Question": "Which SharePoint guidance explains budget approval ownership?",
        "ExpectedAnswer": "The SharePoint guidance points to budget approval ownership by spend type and approval limit. The request should be routed to the finance owner for that budget area, with manager approval included when the amount exceeds the local threshold. Exceptions need documented justification before approval.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q017",
        "ScenarioID": "SC005",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS03",
        "KnowledgeSource": "HR Jira Knowledge Base",
        "RequiredKnowledgeIDs": "KS03",
        "QuestionOrder": "2",
        "Question": "Which knowledge-base article resolves invoice coding issues?",
        "ExpectedAnswer": "The matching knowledge-base article explains the invoice coding issue by checking the cost center, natural account, project code, and tax treatment. If the coding combination is invalid, finance should correct the account mapping and resubmit the invoice for validation.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q018",
        "ScenarioID": "SC005",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "QuestionOrder": "3",
        "Question": "Summarize email guidance for month-end close exceptions.",
        "ExpectedAnswer": "For month-end close exceptions, the email guidance says to document the reason, financial impact, owner, and expected resolution date. The exception should be approved by the finance lead before close activities continue, and the final decision should be captured for audit reference.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q019",
        "ScenarioID": "SC005",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS07",
        "KnowledgeSource": "Employee Handbook",
        "RequiredKnowledgeIDs": "KS07",
        "QuestionOrder": "4",
        "Question": "What employee policy impacts reimbursable travel expenses?",
        "ExpectedAnswer": "The travel reimbursement policy covers eligible business travel costs when the employee provides receipts, business purpose, travel dates, and approval. Non-reimbursable items or expenses above limits should be returned for correction or routed for exception approval.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q020",
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "QuestionOrder": "1",
        "Question": "Show active employee count by finance cost center.",
        "ExpectedAnswer": "Active employee count by finance cost center should show the number of current workers assigned to each cost center, split by employee type where available. Cost centers with unexpected staffing changes should be reviewed for budget impact.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q021",
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS09",
        "KnowledgeSource": "Payroll Dataset",
        "RequiredKnowledgeIDs": "KS09",
        "QuestionOrder": "2",
        "Question": "Show payroll spend trend by region.",
        "ExpectedAnswer": "Payroll spend should be trended by region across the selected period. The answer should show which regions increased or decreased, call out the largest variance drivers, and separate regular pay from overtime or one-time payments where possible.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q022",
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS10",
        "KnowledgeSource": "Workforce Planning Dataset",
        "RequiredKnowledgeIDs": "KS10",
        "QuestionOrder": "3",
        "Question": "Show workforce cost forecast variance by quarter.",
        "ExpectedAnswer": "The workforce cost forecast compares planned cost with forecast cost by quarter. Any variance above the planning threshold should be highlighted with likely drivers such as hiring timing, overtime, attrition, or contractor usage. Finance should review the highest variance quarter first.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q023",
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS11",
        "KnowledgeSource": "Recruiting Analytics Dataset",
        "RequiredKnowledgeIDs": "KS11",
        "QuestionOrder": "4",
        "Question": "Show recruiting pipeline cost impact by hiring stage.",
        "ExpectedAnswer": "The recruiting pipeline cost impact shows open roles by hiring stage, aging, and expected fill date. Roles stuck in late stages or open beyond target time-to-fill should be flagged because they can delay capacity plans and shift cost into later quarters.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q024",
        "ScenarioID": "SC006",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "QuestionOrder": "5",
        "Question": "Show performance-linked bonus spend by rating band.",
        "ExpectedAnswer": "Performance-linked bonus spend should be grouped by rating band and eligible population. The answer should show estimated bonus cost, compare it to budget, and flag rating bands or departments where payout concentration looks unusual.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q025",
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS14",
        "KnowledgeSource": "Invoice Repository",
        "RequiredKnowledgeIDs": "KS14",
        "QuestionOrder": "1",
        "Question": "Extract invoice supplier, total, tax, and due date.",
        "ExpectedAnswer": "The invoice fields include supplier, invoice number, invoice date, subtotal, tax, total, due date, and any exception. If the invoice amount or supplier does not match expected records, it should be routed for finance review before payment.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q026",
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "QuestionOrder": "2",
        "Question": "Summarize contract payment terms and renewal obligations.",
        "ExpectedAnswer": "The contract payment summary should list payment milestones, billing frequency, renewal terms, notice date, and any finance obligations. Upcoming payment or renewal deadlines should be highlighted so finance can plan cash flow and avoid missed notice windows.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q027",
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS16",
        "KnowledgeSource": "Purchase Orders",
        "RequiredKnowledgeIDs": "KS16",
        "QuestionOrder": "3",
        "Question": "Extract purchase order amount, line items, and requester.",
        "ExpectedAnswer": "The purchase order summary should include PO number, requester, supplier, line items, amounts, cost center, and approval status. If the invoice exceeds the PO amount or references an unmatched line item, it should be flagged before processing.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q028",
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS17",
        "KnowledgeSource": "Vendor Agreements",
        "RequiredKnowledgeIDs": "KS17",
        "QuestionOrder": "4",
        "Question": "Identify vendor agreement obligations and penalty clauses.",
        "ExpectedAnswer": "The vendor agreement includes obligations, service levels, renewal dates, penalty clauses, and termination conditions. Finance should focus on clauses that affect payment timing, credits, penalties, and renewal exposure.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q029",
        "ScenarioID": "SC007",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "QuestionOrder": "5",
        "Question": "Extract expense report category, amount, and approval status.",
        "ExpectedAnswer": "The expense report should identify spend category, amount, receipt evidence, approval status, and policy exceptions. Claims with missing receipts, duplicate values, or non-business categories should be held for review before reimbursement.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q030",
        "ScenarioID": "SC008",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "QuestionOrder": "1",
        "Question": "Analyze finance audit call sentiment and risk cues.",
        "ExpectedAnswer": "The finance audit call should be summarized by topic, sentiment, and risk cues. Mentions of missing approvals, audit evidence gaps, urgent close issues, or compliance concerns should be flagged and assigned to a finance owner.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q031",
        "ScenarioID": "SC008",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "QuestionOrder": "2",
        "Question": "Summarize finance transcript actions and compliance concerns.",
        "ExpectedAnswer": "The finance transcript shows the requested action, open questions, responsible owner, and compliance concerns. The answer should separate confirmed facts from follow-up items and identify anything that needs audit documentation.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q032",
        "ScenarioID": "SC008",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS25",
        "KnowledgeSource": "Escalation Recording Library",
        "RequiredKnowledgeIDs": "KS25",
        "QuestionOrder": "3",
        "Question": "Detect escalation indicators in high-priority finance calls.",
        "ExpectedAnswer": "The high-priority finance call contains escalation indicators such as urgency, unresolved payment risk, compliance language, or missed approval. The recommended action is to route the call to the finance escalation owner and document the reason for priority handling.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q033",
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS03",
        "KnowledgeSource": "HR Jira Knowledge Base",
        "RequiredKnowledgeIDs": "KS03",
        "QuestionOrder": "1",
        "Question": "Which knowledge-base article explains escalation triage?",
        "ExpectedAnswer": "The escalation triage article says to identify customer impact, urgency, product or service area, and previous case history. High-severity cases should be routed to the escalation owner with a clear summary, required response time, and next customer update.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q034",
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "QuestionOrder": "2",
        "Question": "Summarize prior customer email guidance for complaint callbacks.",
        "ExpectedAnswer": "Prior complaint callback guidance recommends acknowledging the issue, confirming the customer impact, explaining the next step, and giving a specific callback window. Agents should avoid promising resolution before the case owner confirms the fix.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q035",
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS05",
        "KnowledgeSource": "HR Slack Channel",
        "RequiredKnowledgeIDs": "KS05",
        "QuestionOrder": "3",
        "Question": "What Slack guidance exists for urgent support handoffs?",
        "ExpectedAnswer": "Slack handoff guidance says urgent support issues need a clear owner, severity label, customer impact summary, and next update time. The agent should post the case link, tag the owning team, and confirm acceptance of the handoff.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q036",
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS06",
        "KnowledgeSource": "HR SOP Repository",
        "RequiredKnowledgeIDs": "KS06",
        "QuestionOrder": "4",
        "Question": "What SOP steps should agents follow for complaint escalation?",
        "ExpectedAnswer": "The complaint escalation SOP starts with intake and severity classification, then checks prior cases, assigns an owner, and sets the customer update timeline. Escalation is required for repeat complaints, legal/compliance language, missed SLA, or high-value customer impact.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q037",
        "ScenarioID": "SC009",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "KnowledgeID": "KS07",
        "KnowledgeSource": "Employee Handbook",
        "RequiredKnowledgeIDs": "KS07",
        "QuestionOrder": "5",
        "Question": "What handbook policy applies to customer courtesy credits?",
        "ExpectedAnswer": "The courtesy credit policy defines when an agent can offer a credit, the maximum amount, required approval, and documentation. If the credit exceeds the agent threshold or involves repeated complaints, it should be routed to a supervisor.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q038",
        "ScenarioID": "SC010",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "QuestionOrder": "1",
        "Question": "Show staffed agent count by support team.",
        "ExpectedAnswer": "Staffed agent count should be grouped by support team, shift, and location. The answer should identify queues with low staffing coverage and compare staffing levels against expected call volume or SLA needs.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q039",
        "ScenarioID": "SC010",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS11",
        "KnowledgeSource": "Recruiting Analytics Dataset",
        "RequiredKnowledgeIDs": "KS11",
        "QuestionOrder": "2",
        "Question": "Show hiring pipeline for open call center roles.",
        "ExpectedAnswer": "The call center hiring pipeline should show open roles, current stage, age of requisition, and expected fill date. Roles stuck in screening or interview stages should be flagged because they can affect queue coverage and service levels.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q040",
        "ScenarioID": "SC010",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS12",
        "KnowledgeSource": "Learning Dataset",
        "RequiredKnowledgeIDs": "KS12",
        "QuestionOrder": "3",
        "Question": "Show agent training completion by queue.",
        "ExpectedAnswer": "Agent training completion should show required courses, completed assignments, overdue items, and readiness by queue. Queues with low completion or overdue compliance training should be prioritized for manager follow-up.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q041",
        "ScenarioID": "SC010",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "QuestionOrder": "4",
        "Question": "Show agent quality score distribution by team.",
        "ExpectedAnswer": "Agent quality score distribution should show ratings by team and identify coaching outliers. Teams with low quality scores, high variance, or repeated compliance misses should be reviewed for targeted coaching.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q042",
        "ScenarioID": "SC011",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS14",
        "KnowledgeSource": "Invoice Repository",
        "RequiredKnowledgeIDs": "KS14",
        "QuestionOrder": "1",
        "Question": "Extract billing issue details from the customer invoice.",
        "ExpectedAnswer": "The customer invoice issue should capture invoice number, disputed amount, affected line item, due date, and the reason for dispute. If billing data is incomplete or mismatched, the case should be routed to billing support before customer callback.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q043",
        "ScenarioID": "SC011",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "QuestionOrder": "2",
        "Question": "Summarize service agreement SLA and escalation clauses.",
        "ExpectedAnswer": "The service agreement summary should identify SLA commitments, escalation clauses, penalties, support hours, and renewal terms. Any missed SLA or penalty exposure should be flagged for supervisor review.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q044",
        "ScenarioID": "SC011",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS18",
        "KnowledgeSource": "Employee Forms",
        "RequiredKnowledgeIDs": "KS18",
        "QuestionOrder": "3",
        "Question": "Extract customer complaint form fields and requested resolution.",
        "ExpectedAnswer": "The complaint form should include customer name, issue category, requested resolution, date received, current status, and owner. Missing fields should be returned for completion before the case is closed or escalated.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q045",
        "ScenarioID": "SC011",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "QuestionOrder": "4",
        "Question": "Extract refund amount, reason, and approval status from expense documents.",
        "ExpectedAnswer": "The refund document should show refund amount, reason code, approver, evidence, and exception status. Refunds without supporting documentation or above the approval threshold should be routed to a supervisor.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q046",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "QuestionOrder": "1",
        "Question": "Analyze customer sentiment from the selected call recording.",
        "ExpectedAnswer": "The call recording indicates customer sentiment, intent, urgency, and escalation likelihood. If frustration or repeat-contact language is detected, the agent should prioritize the case and schedule a clear follow-up.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q047",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "QuestionOrder": "2",
        "Question": "Summarize transcript topics, intent, and next best action.",
        "ExpectedAnswer": "The transcript summary should identify the customer topic, intent, resolution status, and next best action. If the issue is unresolved, the next response should state the owner, expected timeline, and what the customer can expect next.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q048",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS22",
        "KnowledgeSource": "Voice Sentiment Samples",
        "RequiredKnowledgeIDs": "KS22",
        "QuestionOrder": "3",
        "Question": "Classify voice sentiment and frustration level.",
        "ExpectedAnswer": "The voice sentiment result should classify emotion, frustration level, and confidence. High frustration or low confidence should trigger a supervisor review or proactive callback.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q049",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS23",
        "KnowledgeSource": "Drone Inspection Videos",
        "RequiredKnowledgeIDs": "KS23",
        "QuestionOrder": "4",
        "Question": "Detect inspection anomalies from the drone video sample.",
        "ExpectedAnswer": "The drone video review should identify visible anomalies, location, confidence, and recommended inspection action. Any severe anomaly should be escalated for manual review with timestamp and frame reference.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q050",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS24",
        "KnowledgeSource": "CCTV Incident Videos",
        "RequiredKnowledgeIDs": "KS24",
        "QuestionOrder": "5",
        "Question": "Identify incident events and urgency from CCTV footage.",
        "ExpectedAnswer": "The CCTV footage review should identify the incident type, urgency, timeline, and required response. Critical events should be flagged with time range, likely impact, and recommended handoff to the response team.",
        "IsPredefined": "Y"
      },
      {
        "QnAID": "Q051",
        "ScenarioID": "SC012",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "KnowledgeID": "KS25",
        "KnowledgeSource": "Escalation Recording Library",
        "RequiredKnowledgeIDs": "KS25",
        "QuestionOrder": "6",
        "Question": "Detect escalation triggers in the high-priority recording.",
        "ExpectedAnswer": "The escalation recording contains urgency, dissatisfaction, compliance terms, and handoff triggers. The recommended action is immediate escalation with a concise summary of the customer issue, risk, and promised next update.",
        "IsPredefined": "Y"
      }
    ],
    "09_Sample_Responses": [
      {
        "QnAID": "Q001",
        "KnowledgeID": "KS01",
        "KnowledgeSource": "HR Policy Repository",
        "RequiredKnowledgeIDs": "KS01",
        "ExpectedResponse": "Maternity leave is available to eligible employees once the request is submitted with the expected leave dates and supporting documentation. The usual flow is: employee submits the leave request, manager reviews coverage impact, HR validates eligibility, and payroll/benefits teams confirm any pay or benefit changes. The next action is to confirm eligibility in the HR policy record and route the request for manager and HR approval.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q002",
        "KnowledgeID": "KS02",
        "KnowledgeSource": "HR SharePoint Portal",
        "RequiredKnowledgeIDs": "KS02",
        "ExpectedResponse": "HR-owned onboarding includes preparing the worker profile, confirming offer and start-date details, assigning required documents, triggering equipment/access requests, and scheduling first-week orientation. The handoff is complete when the manager confirms role readiness and HR marks all onboarding checklist items as complete.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q003",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "ExpectedResponse": "For time-off exceptions, previous HR email guidance says to document the reason, check manager coverage, confirm policy eligibility, and route exceptions to HR for approval. Employees should receive a clear response that includes whether the exception is approved, what dates are covered, and any payroll or balance impact.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q004",
        "KnowledgeID": "KS05",
        "KnowledgeSource": "HR Slack Channel",
        "RequiredKnowledgeIDs": "KS05",
        "ExpectedResponse": "The HR Slack clarification says leave exceptions should not be handled informally. HR should capture the employee context, confirm policy category, ask the manager to validate business coverage, and then record the final decision in the HR case notes so future questions use the same precedent.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q005",
        "KnowledgeID": "KS06",
        "KnowledgeSource": "HR SOP Repository",
        "RequiredKnowledgeIDs": "KS06",
        "ExpectedResponse": "For an HR case escalation, first capture the employee issue and urgency, then classify the case type, assign an owner, and check whether policy, payroll, legal, or manager input is required. Escalate when there is compliance risk, missed SLA, payroll impact, or employee relations sensitivity. Close the case only after the employee receives the final documented answer.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q006",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "ExpectedResponse": "Active headcount can be shown by grouping the employee master records by department and worker type. The useful view is total active employees, full-time versus contingent split, and departments with unusual growth or low staffing. This helps HR identify where workforce capacity may need review.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q007",
        "KnowledgeID": "KS10",
        "KnowledgeSource": "Workforce Planning Dataset",
        "RequiredKnowledgeIDs": "KS10",
        "ExpectedResponse": "The workforce forecast should compare planned demand with available supply for each quarter. Any quarter where demand is higher than supply should be flagged as a staffing gap. The answer should call out the largest gaps, the affected job families, and whether hiring, transfer, or contractor coverage is the recommended action.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q008",
        "KnowledgeID": "KS12",
        "KnowledgeSource": "Learning Dataset",
        "RequiredKnowledgeIDs": "KS12",
        "ExpectedResponse": "Mandatory learning completion should show assigned, completed, overdue, and completion percentage by organization. Groups below the target completion rate should be highlighted first, along with overdue counts and the recommended reminder or escalation action.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q009",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "ExpectedResponse": "The performance rating view should show how ratings are distributed by manager group. A balanced distribution is expected; unusually high or low clusters should be flagged for calibration review. The output should identify manager groups with rating concentration, missing reviews, or year-over-year movement.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q010",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "ExpectedResponse": "The contract summary should identify the employee or vendor party, effective date, renewal date, notice period, and major obligations. HR should focus on clauses that affect role, compensation, confidentiality, termination, and renewal actions. Any upcoming renewal or notice deadline should be flagged as a next step.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q011",
        "KnowledgeID": "KS18",
        "KnowledgeSource": "Employee Forms",
        "RequiredKnowledgeIDs": "KS18",
        "ExpectedResponse": "The employee form contains the employee identifier, form type, effective date, submitted date, approval status, and any missing required fields. If the form is incomplete, the next action is to return it to the employee or manager with the missing field list. If complete, it can move to approval or record update.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q012",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "ExpectedResponse": "The expense report should show the claimed amount, category, receipt status, approver, and whether the claim fits policy. Any missing receipt, late submission, duplicate amount, or out-of-policy category should be marked for review before reimbursement.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q013",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "ExpectedResponse": "The HR service call indicates the employee intent, current sentiment, urgency level, and recommended follow-up. If the employee sounds frustrated or the issue affects pay, benefits, or leave, the case should be prioritized and routed to the responsible HR specialist.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q014",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "ExpectedResponse": "The transcript themes show what employees are asking for, the tone of the conversation, and unresolved action items. The recommended response should acknowledge the concern, confirm the next owner, and give the employee a clear timeline for resolution.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q015",
        "KnowledgeID": "KS22",
        "KnowledgeSource": "Voice Sentiment Samples",
        "RequiredKnowledgeIDs": "KS22",
        "ExpectedResponse": "The voice samples show the emotional tone and confidence of each interaction. Calls with frustration, confusion, or urgency should be flagged for follow-up. Positive calls can be used as examples for coaching and standard response improvement.",
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q016",
        "KnowledgeID": "KS02",
        "KnowledgeSource": "HR SharePoint Portal",
        "RequiredKnowledgeIDs": "KS02",
        "ExpectedResponse": "The SharePoint guidance points to budget approval ownership by spend type and approval limit. The request should be routed to the finance owner for that budget area, with manager approval included when the amount exceeds the local threshold. Exceptions need documented justification before approval.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q017",
        "KnowledgeID": "KS03",
        "KnowledgeSource": "HR Jira Knowledge Base",
        "RequiredKnowledgeIDs": "KS03",
        "ExpectedResponse": "The matching knowledge-base article explains the invoice coding issue by checking the cost center, natural account, project code, and tax treatment. If the coding combination is invalid, finance should correct the account mapping and resubmit the invoice for validation.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q018",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "ExpectedResponse": "For month-end close exceptions, the email guidance says to document the reason, financial impact, owner, and expected resolution date. The exception should be approved by the finance lead before close activities continue, and the final decision should be captured for audit reference.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q019",
        "KnowledgeID": "KS07",
        "KnowledgeSource": "Employee Handbook",
        "RequiredKnowledgeIDs": "KS07",
        "ExpectedResponse": "The travel reimbursement policy covers eligible business travel costs when the employee provides receipts, business purpose, travel dates, and approval. Non-reimbursable items or expenses above limits should be returned for correction or routed for exception approval.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q020",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "ExpectedResponse": "Active employee count by finance cost center should show the number of current workers assigned to each cost center, split by employee type where available. Cost centers with unexpected staffing changes should be reviewed for budget impact.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q021",
        "KnowledgeID": "KS09",
        "KnowledgeSource": "Payroll Dataset",
        "RequiredKnowledgeIDs": "KS09",
        "ExpectedResponse": "Payroll spend should be trended by region across the selected period. The answer should show which regions increased or decreased, call out the largest variance drivers, and separate regular pay from overtime or one-time payments where possible.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q022",
        "KnowledgeID": "KS10",
        "KnowledgeSource": "Workforce Planning Dataset",
        "RequiredKnowledgeIDs": "KS10",
        "ExpectedResponse": "The workforce cost forecast compares planned cost with forecast cost by quarter. Any variance above the planning threshold should be highlighted with likely drivers such as hiring timing, overtime, attrition, or contractor usage. Finance should review the highest variance quarter first.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q023",
        "KnowledgeID": "KS11",
        "KnowledgeSource": "Recruiting Analytics Dataset",
        "RequiredKnowledgeIDs": "KS11",
        "ExpectedResponse": "The recruiting pipeline cost impact shows open roles by hiring stage, aging, and expected fill date. Roles stuck in late stages or open beyond target time-to-fill should be flagged because they can delay capacity plans and shift cost into later quarters.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q024",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "ExpectedResponse": "Performance-linked bonus spend should be grouped by rating band and eligible population. The answer should show estimated bonus cost, compare it to budget, and flag rating bands or departments where payout concentration looks unusual.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q025",
        "KnowledgeID": "KS14",
        "KnowledgeSource": "Invoice Repository",
        "RequiredKnowledgeIDs": "KS14",
        "ExpectedResponse": "The invoice fields include supplier, invoice number, invoice date, subtotal, tax, total, due date, and any exception. If the invoice amount or supplier does not match expected records, it should be routed for finance review before payment.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q026",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "ExpectedResponse": "The contract payment summary should list payment milestones, billing frequency, renewal terms, notice date, and any finance obligations. Upcoming payment or renewal deadlines should be highlighted so finance can plan cash flow and avoid missed notice windows.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q027",
        "KnowledgeID": "KS16",
        "KnowledgeSource": "Purchase Orders",
        "RequiredKnowledgeIDs": "KS16",
        "ExpectedResponse": "The purchase order summary should include PO number, requester, supplier, line items, amounts, cost center, and approval status. If the invoice exceeds the PO amount or references an unmatched line item, it should be flagged before processing.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q028",
        "KnowledgeID": "KS17",
        "KnowledgeSource": "Vendor Agreements",
        "RequiredKnowledgeIDs": "KS17",
        "ExpectedResponse": "The vendor agreement includes obligations, service levels, renewal dates, penalty clauses, and termination conditions. Finance should focus on clauses that affect payment timing, credits, penalties, and renewal exposure.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q029",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "ExpectedResponse": "The expense report should identify spend category, amount, receipt evidence, approval status, and policy exceptions. Claims with missing receipts, duplicate values, or non-business categories should be held for review before reimbursement.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q030",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "ExpectedResponse": "The finance audit call should be summarized by topic, sentiment, and risk cues. Mentions of missing approvals, audit evidence gaps, urgent close issues, or compliance concerns should be flagged and assigned to a finance owner.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q031",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "ExpectedResponse": "The finance transcript shows the requested action, open questions, responsible owner, and compliance concerns. The answer should separate confirmed facts from follow-up items and identify anything that needs audit documentation.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q032",
        "KnowledgeID": "KS25",
        "KnowledgeSource": "Escalation Recording Library",
        "RequiredKnowledgeIDs": "KS25",
        "ExpectedResponse": "The high-priority finance call contains escalation indicators such as urgency, unresolved payment risk, compliance language, or missed approval. The recommended action is to route the call to the finance escalation owner and document the reason for priority handling.",
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q033",
        "KnowledgeID": "KS03",
        "KnowledgeSource": "HR Jira Knowledge Base",
        "RequiredKnowledgeIDs": "KS03",
        "ExpectedResponse": "The escalation triage article says to identify customer impact, urgency, product or service area, and previous case history. High-severity cases should be routed to the escalation owner with a clear summary, required response time, and next customer update.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q034",
        "KnowledgeID": "KS04",
        "KnowledgeSource": "HR Email Archive",
        "RequiredKnowledgeIDs": "KS04",
        "ExpectedResponse": "Prior complaint callback guidance recommends acknowledging the issue, confirming the customer impact, explaining the next step, and giving a specific callback window. Agents should avoid promising resolution before the case owner confirms the fix.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q035",
        "KnowledgeID": "KS05",
        "KnowledgeSource": "HR Slack Channel",
        "RequiredKnowledgeIDs": "KS05",
        "ExpectedResponse": "Slack handoff guidance says urgent support issues need a clear owner, severity label, customer impact summary, and next update time. The agent should post the case link, tag the owning team, and confirm acceptance of the handoff.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q036",
        "KnowledgeID": "KS06",
        "KnowledgeSource": "HR SOP Repository",
        "RequiredKnowledgeIDs": "KS06",
        "ExpectedResponse": "The complaint escalation SOP starts with intake and severity classification, then checks prior cases, assigns an owner, and sets the customer update timeline. Escalation is required for repeat complaints, legal/compliance language, missed SLA, or high-value customer impact.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q037",
        "KnowledgeID": "KS07",
        "KnowledgeSource": "Employee Handbook",
        "RequiredKnowledgeIDs": "KS07",
        "ExpectedResponse": "The courtesy credit policy defines when an agent can offer a credit, the maximum amount, required approval, and documentation. If the credit exceeds the agent threshold or involves repeated complaints, it should be routed to a supervisor.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG"
      },
      {
        "QnAID": "Q038",
        "KnowledgeID": "KS08",
        "KnowledgeSource": "Employee Master Dataset",
        "RequiredKnowledgeIDs": "KS08",
        "ExpectedResponse": "Staffed agent count should be grouped by support team, shift, and location. The answer should identify queues with low staffing coverage and compare staffing levels against expected call volume or SLA needs.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q039",
        "KnowledgeID": "KS11",
        "KnowledgeSource": "Recruiting Analytics Dataset",
        "RequiredKnowledgeIDs": "KS11",
        "ExpectedResponse": "The call center hiring pipeline should show open roles, current stage, age of requisition, and expected fill date. Roles stuck in screening or interview stages should be flagged because they can affect queue coverage and service levels.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q040",
        "KnowledgeID": "KS12",
        "KnowledgeSource": "Learning Dataset",
        "RequiredKnowledgeIDs": "KS12",
        "ExpectedResponse": "Agent training completion should show required courses, completed assignments, overdue items, and readiness by queue. Queues with low completion or overdue compliance training should be prioritized for manager follow-up.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q041",
        "KnowledgeID": "KS13",
        "KnowledgeSource": "Performance Dataset",
        "RequiredKnowledgeIDs": "KS13",
        "ExpectedResponse": "Agent quality score distribution should show ratings by team and identify coaching outliers. Teams with low quality scores, high variance, or repeated compliance misses should be reviewed for targeted coaching.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL"
      },
      {
        "QnAID": "Q042",
        "KnowledgeID": "KS14",
        "KnowledgeSource": "Invoice Repository",
        "RequiredKnowledgeIDs": "KS14",
        "ExpectedResponse": "The customer invoice issue should capture invoice number, disputed amount, affected line item, due date, and the reason for dispute. If billing data is incomplete or mismatched, the case should be routed to billing support before customer callback.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q043",
        "KnowledgeID": "KS15",
        "KnowledgeSource": "Contract Repository",
        "RequiredKnowledgeIDs": "KS15",
        "ExpectedResponse": "The service agreement summary should identify SLA commitments, escalation clauses, penalties, support hours, and renewal terms. Any missed SLA or penalty exposure should be flagged for supervisor review.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q044",
        "KnowledgeID": "KS18",
        "KnowledgeSource": "Employee Forms",
        "RequiredKnowledgeIDs": "KS18",
        "ExpectedResponse": "The complaint form should include customer name, issue category, requested resolution, date received, current status, and owner. Missing fields should be returned for completion before the case is closed or escalated.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q045",
        "KnowledgeID": "KS19",
        "KnowledgeSource": "Expense Reports",
        "RequiredKnowledgeIDs": "KS19",
        "ExpectedResponse": "The refund document should show refund amount, reason code, approver, evidence, and exception status. Refunds without supporting documentation or above the approval threshold should be routed to a supervisor.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI"
      },
      {
        "QnAID": "Q046",
        "KnowledgeID": "KS20",
        "KnowledgeSource": "Call Center Audio Library",
        "RequiredKnowledgeIDs": "KS20",
        "ExpectedResponse": "The call recording indicates customer sentiment, intent, urgency, and escalation likelihood. If frustration or repeat-contact language is detected, the agent should prioritize the case and schedule a clear follow-up.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q047",
        "KnowledgeID": "KS21",
        "KnowledgeSource": "Customer Transcript Library",
        "RequiredKnowledgeIDs": "KS21",
        "ExpectedResponse": "The transcript summary should identify the customer topic, intent, resolution status, and next best action. If the issue is unresolved, the next response should state the owner, expected timeline, and what the customer can expect next.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q048",
        "KnowledgeID": "KS22",
        "KnowledgeSource": "Voice Sentiment Samples",
        "RequiredKnowledgeIDs": "KS22",
        "ExpectedResponse": "The voice sentiment result should classify emotion, frustration level, and confidence. High frustration or low confidence should trigger a supervisor review or proactive callback.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q049",
        "KnowledgeID": "KS23",
        "KnowledgeSource": "Drone Inspection Videos",
        "RequiredKnowledgeIDs": "KS23",
        "ExpectedResponse": "The drone video review should identify visible anomalies, location, confidence, and recommended inspection action. Any severe anomaly should be escalated for manual review with timestamp and frame reference.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q050",
        "KnowledgeID": "KS24",
        "KnowledgeSource": "CCTV Incident Videos",
        "RequiredKnowledgeIDs": "KS24",
        "ExpectedResponse": "The CCTV footage review should identify the incident type, urgency, timeline, and required response. Critical events should be flagged with time range, likely impact, and recommended handoff to the response team.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      },
      {
        "QnAID": "Q051",
        "KnowledgeID": "KS25",
        "KnowledgeSource": "Escalation Recording Library",
        "RequiredKnowledgeIDs": "KS25",
        "ExpectedResponse": "The escalation recording contains urgency, dissatisfaction, compliance terms, and handoff triggers. The recommended action is immediate escalation with a concise summary of the customer issue, risk, and promised next update.",
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive"
      }
    ],
    "10_Blueprint_Map": [
      {
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "BlueprintType": "HR_RAG",
        "BlueprintTheme": "HR policy and employee guidance",
        "ExecutionStyle": "Explore locked preview"
      },
      {
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "BlueprintType": "HR_NLSQL",
        "BlueprintTheme": "HR workforce analytics",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "BlueprintType": "HR_DocumentAI",
        "BlueprintTheme": "HR document extraction",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P01",
        "PersonaName": "HR Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "BlueprintType": "HR_Cognitive",
        "BlueprintTheme": "HR call and sentiment analysis",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "BlueprintType": "Finance_RAG",
        "BlueprintTheme": "Finance policy and controls",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "BlueprintType": "Finance_NLSQL",
        "BlueprintTheme": "Finance planning and cost analytics",
        "ExecutionStyle": "Explore locked preview"
      },
      {
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "BlueprintType": "Finance_DocumentAI",
        "BlueprintTheme": "Finance document extraction",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P02",
        "PersonaName": "Finance Specialist",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "BlueprintType": "Finance_Cognitive",
        "BlueprintTheme": "Finance audio and video analysis",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP01",
        "AgentPatternName": "RAG",
        "BlueprintType": "Call_RAG",
        "BlueprintTheme": "Customer support knowledge search",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP02",
        "AgentPatternName": "NLSQL",
        "BlueprintType": "Call_NLSQL",
        "BlueprintTheme": "Call center metrics analytics",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP03",
        "AgentPatternName": "Document AI",
        "BlueprintType": "Call_DocumentAI",
        "BlueprintTheme": "Call center document processing",
        "ExecutionStyle": "Engineer editable"
      },
      {
        "PersonaID": "P03",
        "PersonaName": "Call Center Agent",
        "AgentPatternID": "AP04",
        "AgentPatternName": "Cognitive",
        "BlueprintType": "Call_Cognitive",
        "BlueprintTheme": "Call center audio and video intelligence",
        "ExecutionStyle": "Explore locked preview"
      }
    ],
    "11_Content_Repository_Map": [
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "Policies",
        "ContentType": "PDF/DOCX policy files",
        "SampleInstruction": "Create sample HR policy docs"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "SharePoint",
        "ContentType": "Portal pages and guides",
        "SampleInstruction": "Create sample SharePoint HTML/MD pages"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "Emails",
        "ContentType": "Shared mailbox samples",
        "SampleInstruction": "Create sample HR email threads"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "Slack",
        "ContentType": "Chat threads and summaries",
        "SampleInstruction": "Create sample HR Slack conversations"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "Jira",
        "ContentType": "Issue and runbook samples",
        "SampleInstruction": "Create sample HR Jira exports"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "HR",
        "Folder": "SOPs",
        "ContentType": "Workflow documents",
        "SampleInstruction": "Create HR SOP documents"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Finance",
        "Folder": "Policies",
        "ContentType": "Financial policy docs",
        "SampleInstruction": "Create sample finance policies"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Finance",
        "Folder": "SharePoint",
        "ContentType": "Finance guidance pages",
        "SampleInstruction": "Create finance portal pages"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Finance",
        "Folder": "Emails",
        "ContentType": "Finance mailbox samples",
        "SampleInstruction": "Create finance email threads"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Finance",
        "Folder": "Jira",
        "ContentType": "Finance issue history",
        "SampleInstruction": "Create finance Jira exports"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Call Center",
        "Folder": "Knowledge Articles",
        "ContentType": "Support articles",
        "SampleInstruction": "Create customer support KB articles"
      },
      {
        "Pattern": "RAG",
        "PersonaGroup": "Call Center",
        "Folder": "Escalation Docs",
        "ContentType": "Escalation SOPs",
        "SampleInstruction": "Create support escalation docs"
      },
      {
        "Pattern": "NLSQL",
        "PersonaGroup": "HR",
        "Folder": "Employee Master",
        "ContentType": "CSV/JSON worker master data",
        "SampleInstruction": "Create employee master dataset"
      },
      {
        "Pattern": "NLSQL",
        "PersonaGroup": "HR",
        "Folder": "Learning",
        "ContentType": "CSV learning assignments",
        "SampleInstruction": "Create learning completion dataset"
      },
      {
        "Pattern": "NLSQL",
        "PersonaGroup": "Finance",
        "Folder": "Payroll",
        "ContentType": "CSV payroll data",
        "SampleInstruction": "Create payroll dataset"
      },
      {
        "Pattern": "NLSQL",
        "PersonaGroup": "Finance",
        "Folder": "Budget",
        "ContentType": "CSV budget data",
        "SampleInstruction": "Create budget dataset"
      },
      {
        "Pattern": "NLSQL",
        "PersonaGroup": "Call Center",
        "Folder": "Metrics",
        "ContentType": "CSV/JSON operational metrics",
        "SampleInstruction": "Create call center metrics datasets"
      },
      {
        "Pattern": "Document AI",
        "PersonaGroup": "HR",
        "Folder": "Forms",
        "ContentType": "Employee form PDFs",
        "SampleInstruction": "Create sample employee form PDFs"
      },
      {
        "Pattern": "Document AI",
        "PersonaGroup": "Finance",
        "Folder": "Invoices",
        "ContentType": "Invoice PDFs",
        "SampleInstruction": "Create sample invoice PDFs"
      },
      {
        "Pattern": "Document AI",
        "PersonaGroup": "Finance",
        "Folder": "Contracts",
        "ContentType": "Contract PDFs/DOCX",
        "SampleInstruction": "Create sample contracts"
      },
      {
        "Pattern": "Document AI",
        "PersonaGroup": "Finance",
        "Folder": "POs",
        "ContentType": "Purchase order PDFs",
        "SampleInstruction": "Create sample purchase orders"
      },
      {
        "Pattern": "Document AI",
        "PersonaGroup": "Call Center",
        "Folder": "Claims",
        "ContentType": "Complaint and case forms",
        "SampleInstruction": "Create sample complaint forms"
      },
      {
        "Pattern": "Cognitive",
        "PersonaGroup": "Call Center",
        "Folder": "Audio",
        "ContentType": "Call recordings",
        "SampleInstruction": "Create placeholder audio folder and README"
      },
      {
        "Pattern": "Cognitive",
        "PersonaGroup": "Call Center",
        "Folder": "Video",
        "ContentType": "Drone/CCTV videos",
        "SampleInstruction": "Create placeholder video folder and README"
      },
      {
        "Pattern": "Cognitive",
        "PersonaGroup": "Operations",
        "Folder": "Drone",
        "ContentType": "Drone inspection video samples",
        "SampleInstruction": "Create placeholder drone folder and README"
      },
      {
        "Pattern": "Cognitive",
        "PersonaGroup": "Operations",
        "Folder": "CCTV",
        "ContentType": "Incident footage samples",
        "SampleInstruction": "Create placeholder CCTV folder and README"
      }
    ],
    "12_Leaderboard_Config": [
      {
        "Metric": "Blueprint completeness",
        "Description": "How complete the selected blueprint is",
        "Weight": "30"
      },
      {
        "Metric": "Knowledge source coverage",
        "Description": "How well selected sources match the scenario",
        "Weight": "25"
      },
      {
        "Metric": "Question coverage",
        "Description": "How many scenario Q&A items are available",
        "Weight": "20"
      },
      {
        "Metric": "Test success",
        "Description": "How many sample tests pass",
        "Weight": "25"
      }
    ]
  },
  "blueprintNodeTemplates": {
    "RAG": [
      {
        "id": "user",
        "label": "User",
        "detail": "Persona question and task intent"
      },
      {
        "id": "source",
        "label": "Knowledge Source",
        "detail": "Selected workbook mapped content"
      },
      {
        "id": "retriever",
        "label": "Retriever",
        "detail": "Semantic search and source ranking"
      },
      {
        "id": "vector",
        "label": "Vector Store",
        "detail": "OCI vector index and grounding"
      },
      {
        "id": "genai",
        "label": "Oracle GenAI",
        "detail": "Grounded generation and policy controls"
      },
      {
        "id": "response",
        "label": "Response",
        "detail": "Answer with trace and source evidence"
      }
    ],
    "NLSQL": [
      {
        "id": "user",
        "label": "User",
        "detail": "Natural language business question"
      },
      {
        "id": "nlq",
        "label": "Natural Language Query",
        "detail": "Intent, metric and dimension extraction"
      },
      {
        "id": "sql",
        "label": "SQL Generator",
        "detail": "Validated SQL plan"
      },
      {
        "id": "database",
        "label": "Database",
        "detail": "Oracle Database query execution"
      },
      {
        "id": "results",
        "label": "Results",
        "detail": "Aggregated and checked result set"
      },
      {
        "id": "response",
        "label": "Response",
        "detail": "Business answer and supporting metrics"
      }
    ],
    "Document AI": [
      {
        "id": "user",
        "label": "User",
        "detail": "Document request or uploaded file"
      },
      {
        "id": "upload",
        "label": "Document Upload",
        "detail": "Workbook mapped document intake"
      },
      {
        "id": "ocr",
        "label": "OCR",
        "detail": "Text and layout extraction"
      },
      {
        "id": "understanding",
        "label": "Document Understanding",
        "detail": "Entity, table and clause detection"
      },
      {
        "id": "llm",
        "label": "LLM",
        "detail": "Reasoning with extracted evidence"
      },
      {
        "id": "response",
        "label": "Response",
        "detail": "Summary, fields and next action"
      }
    ],
    "Cognitive": [
      {
        "id": "user",
        "label": "User",
        "detail": "Audio, video or case question"
      },
      {
        "id": "media",
        "label": "Audio / Video",
        "detail": "Workbook mapped media metadata"
      },
      {
        "id": "analysis",
        "label": "AI Analysis",
        "detail": "Speech, vision and sentiment features"
      },
      {
        "id": "classification",
        "label": "Classification",
        "detail": "Risk, intent and priority labels"
      },
      {
        "id": "insights",
        "label": "Insights",
        "detail": "Operational findings and recommended action"
      },
      {
        "id": "response",
        "label": "Response",
        "detail": "Explainable answer and trace"
      }
    ]
  },
  "runtimeTemplates": {
    "RAG": [
      "Resolve persona and mapped workbook knowledge sources.",
      "Retrieve the highest scoring policy, email, Slack, and document evidence.",
      "Ground the answer with Oracle GenAI and source constraints.",
      "Return a response with cited source categories and execution trace."
    ],
    "NLSQL": [
      "Resolve requested metrics, filters, and time window.",
      "Generate validated SQL against the workbook mapped dataset.",
      "Execute the query and inspect result shape.",
      "Return the answer with metric details and query rationale."
    ],
    "Document AI": [
      "Locate the workbook mapped document collection.",
      "Extract text, layout, entities, tables, and document clauses.",
      "Reason over extracted evidence with Oracle GenAI.",
      "Return structured findings and confidence notes."
    ],
    "Cognitive": [
      "Locate media metadata and transcript sources.",
      "Analyze audio, video, sentiment, category, and event signals.",
      "Classify priority, risk, and next-best action.",
      "Return operational insights with runtime trace."
    ]
  }
};

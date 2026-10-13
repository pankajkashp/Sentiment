# PolicyLens Experiment Summary: Sentiment Analysis Baseline

### What Was Done
We replaced the unavailable Amazon Reviews Multi dataset with  (Subscription_Boxes category, N=16,205 usable reviews) to establish a deterministic 3-class sentiment baseline (Negative: 1–2 stars, Neutral: 3 stars, Positive: 4–5 stars). A group-level stratified split (80% train, 10% val, 10% test) was implemented to prevent review duplication leakage across partitions. We evaluated TF-IDF (10,000 features, n-grams 1–2) with Logistic Regression and Linear Support Vector Machines under standard and class-balanced weighting.

### Measured Findings
- Linear SVM (Standard) achieved the highest raw test accuracy at 79.95% (Macro-F1: 0.6254).
- Logistic Regression (Balanced) achieved the highest test Macro-F1 at 0.6688 (Accuracy: 78.27%), boosting minority Neutral recall from 8.5% to 46.89% (+8.6% absolute Macro-F1 improvement).

### What Can Be Concluded
Linear models with balanced class weighting provide a competitive, computationally lightweight baseline for 3-class consumer sentiment, effectively mitigating majority-class bias.

### What Cannot Yet Be Claimed
High sentiment classification accuracy on commercial product reviews does not demonstrate an ability to extract policy concerns or synthesize collective verdicts from civic consultation comments. Consultation texts exhibit nuanced stakeholder demands, bilingual variance, and lack explicit star ratings, necessitating domain-specific policy extraction.

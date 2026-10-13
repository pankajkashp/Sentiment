# PolicyLens Experiment Summary: Semantic Feedback Grouping

### What Was Done
We applied dense sentence embeddings (`all-MiniLM-L6-v2`, 384 dimensions) and K-Means clustering with silhouette optimization ($K \in [5, 10]$) to 2,161 substantive public consultation comments from Question 8 of Canada's *Open Government Consultation 2017–18* dataset. We extracted centroid-nearest representative comments, salient TF-IDF keywords, and candidate policy concerns and demands for each cluster to prototype an evidence-backed collective verdict workflow.

### Measured Findings
- Optimal cluster separation was identified at $K=9$ (Silhouette Score: $0.0603$), segmenting comments into distinct civic domains including Citizen-Centric Governance (24.0%), Democratic Reform & Accountability (16.1%), Francophone Priorities (14.9%), Fiscal Accountability (11.1%), Social Policy (11.1%), Open Data Standards (8.3%), Indigenous Reconciliation (8.2%), Climate Transparency (4.4%), and Phoenix Pay System Resolution (2.0%).
- Dense embeddings naturally isolated Francophone comments (99.4% purity in Cluster 6) and distinct institutional grievances (Cluster 7 focused specifically on the federal Phoenix pay system).

### What Can Be Concluded
Unsupervised semantic embeddings can rapidly organize multi-thousand comment consultations into coherent, reviewable thematic groups and surface highly central verbatim citizen evidence without modifying source text.

### What Cannot Yet Be Claimed
Clustering accuracy and the validity of the candidate concern and demand summaries **cannot yet be claimed as accurate or ground truth**. Because the dataset currently has zero human-annotated policy ground-truth labels, the cluster boundaries, candidate concerns, and requested actions remain unverified hypotheses until formally evaluated against human ground truth via the provided annotation and review worksheets.

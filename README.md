# strangeloop-code-test

### Pre-requisites

- Node >=20
- Yarn

### How To Run

Once you have all pre-requisites installed, to run the full flow, just do
`yarn test:e2e`
from root directory of the project.

The main "acceptance test" that exercises the requested scenario in the problem statement is
in [financial-report-document-analyser.e2e.test](test/e2e/financial-report-document-analyser.e2e.test.ts)

It'll create an output directory in the e2e folder containing output of each individual phase of the process (see ["
Design decisions and/or consideration"](#design-decisions-andor-considerations) section below for more detail)

### Assumptions

1. The financial report might contain an incomplete information that might not fully satisfy the financial analysis
   requirement.
2. The financial report will come in pdf format and will be in English (multi-language and non-pdf is out-of-scope)
3. Report is assumed to possibly contain a certain degree of errors that could cause an inconsistent metrics being
   produced (e.g. revenue having 2 different values in the document due to typo or miss-quoted transcript).
4. When an inconsistent metrics being produced by the analysis agent, it is assumed that a manual human intervention is
   needed to reconcile the number, and decide which number is the correct one.
5. End user will end up having some sort of UI to reconcile the inconsistent metric (and the implementation of the UI is
   out-of-scope)
6. Customer will only need the output in a form that can be easily exported to excel
7. Scoring mechanism for the company will use PwC standard with 1-5 scale and RAG (at least that's what Gemini and
   Claude
   thinks what the PwC standard is) designation based on typical
   financial metrics (e.g. revenue, profit, earning per share, etc.)
8. The full workflow, from document ingestion, transformation and export is assumed to happen in a distinct phase (i.e.
   they're not a single pass-through) with some sort of persistence and task scheduling mechanism in between.

### Design decisions and/or considerations

1. The system is designed to have three distinct phases that happens independently, separated by a persistence and/or
   task scheduling layer. These phases are:
    - Ingestion (automatic)
    - Transformation (automatic)
    - Reconciliation and export (user-driven)
2. There's no single coordinating service created to run through the full workflow (e.g.
   DocumentAnalysisService). As a replacement, and end-to-end test that exercise the full workflow is
   added to verify that the whole process works from start to finish, and the expected output is produced.
3. The vision of the full workflow in deployed environment will probably work like this:
    - User upload a bunch of pdf document and/or url to analyse
    - These urls or documents is persisted in some sort of db, with the file persisted in some sort of file storage
      system (e.g. s3) or downloaded directly from source when it needs to be ingested.
    - These persisted urls or documents is then scheduled for ingestion.
    - A background monitoring task checks for any file needing ingesting and pick them up in batches to be ingested.
      Once it's finished, it'll persist the ingestion result and schedule it for transformation.
    - A different background monitoring task checks for any ingestion results needing transformation, pick them up in
      batches, and transform them. Once transformation completed, it'll then persist the result.
    - The result of the transformation will be exposed to the user through some sort of UI that allows them to easily
      see and resolve any discrepancies, and export all or a subset of it using a certain format (e.g. csv).
4. Few advantages of these split phases:
    - **Scalability**. As everything run separately from the main app, we can scale them as much as we want to multiple
      instance (with probably just the centralised database as the main constraint)
    - **Easier to debug and Rerun**. As each phases has their own persisted output, each phase could be observed,
      debugged, fixed and rerun independently without having to rerun the whole workflow from start to finish (e.g. if
      there's a bug in transformation phase, we can fix it and just rerun the transformation phase without having to
      reingest and reanalyse the data again).
    - **Separate lifecycle**. Critical failure on one of the phase (due to bug or any system issue) is localised to that
      phase, and shouldn't affect other phases.
    - **Better customisation**. Having distinct, independent phases allows us to easily inject custom, customer-specific
      logic when needed (e.g. if customer A and customer B needs to do vastly different transformation/ingestion, we can
      just create split the background task to execute custom logic for the individual customer).
    - **Shareable resources**. Having distinct phases persist their result independently allows us to possibly reuse
      resources across customers and reduce cost (e.g. if customer A and customer B both requested to generate report
      for company C from the same set of documents, we can just ingest the document once, and reuse the same ingestion
      result to transform the data for customer A and B).
5. Ingested data is designed to extract as much possibly relevant information as we can from the document. This will
   cost an extra ingestion, but will save us a lot of hassle if we decided that we needed more information in the
   future (e.g. a new customer comes in with additional requirements). It also persists the citation information of the
   source data, so when a human needs to manually resolve some inconsistent data, we can use these citation informations
   to point them to the relevant area in the source document.
6. Normalisation/transformation mechanism is designed to aggregate data, but keep their source information intact, so
   it's easier for us to debug and fix AI mistakes (e.g. the AI aggregating metrics that it thinks the same, but are
   actually a different one).
7. For simplicity, claude is used for the purpose of this code test, using hardcoded API key. Ideally, it would probably
   better to use locally deployed LLM for this to save cost, but I feel like it would be too complicated of a setup for
   this purpose. Hardcoded API key in the config is a smell, but it's the simplest setup for this code test purpose.
   Will be deleting the api key after we're through with the interview process.
8. Financial metric normalisation could be done as part of the ingestion process, but I opt to do it as a separate task,
   allowing us to have a more complete, richer ingested data in case we need it for additional requirements in the
   future (It'll probably incur additional cost, but I think they are fairly minimal).

**Additional Note:**

Most of the code is vibe-coded using claude code, with me fully driving the design and the architecture of the
implementation. Claude is used to generate code on the implementation level with specific prompt. Instead of
telling claude to read and implement the problem statement, I instructed it to create a class with a specific
behaviour/function that I want.  

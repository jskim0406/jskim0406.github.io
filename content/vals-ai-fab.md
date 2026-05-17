---
title: "vals.ai — Finance Agent Benchmark (FAB)"
date: 2026-05-16
tags:
  - finance
  - benchmark
  - agent-eval
  - llm
description: "vals.ai가 공개한 금융 에이전트 벤치마크 FAB의 평가 체계·태스크 구성·결과 해석."
---

# vals.ai - Finance Agent Benchmark(FAB)

## 들어가며

지난 글에서는 Anthropic이 공개한 Finance Agent 템플릿이 어떻게 생겼는 지를 살펴봤습니다. 그 마지막에 잠깐 인용했던 숫자 하나가 있습니다 — `Claude Opus 4.7`이 finance 영역에서 SOTA를 기록했다는 근거로 든 [Vals AI Finance Agent Benchmark](https://www.vals.ai/benchmarks/finance_agent)의 **64.37%** 라는 정확도였습니다.

이 숫자를 처음 봤을 때, 솔직히 '잘 나왔구나' 보다 '근데 이게 도대체 뭘 어떻게 측정한 거지?' 하는 호기심이 먼저 들었습니다. 어떤 문제를 풀게 한 건지, 답이 맞고 틀렸다는 건 누가 어떻게 판정한 건지, 그리고 64.37%면 1등이라지만 그게 실무 기준으로는 어느 정도 수준인지 같은 것들입니다.

<!-- IMG: vals.ai Finance Agent Benchmark v1.1 리더보드 상단 (Claude Opus 4.7 = 64.37% 1위 표시 부분 캡처). 출처: https://www.vals.ai/benchmarks/finance_agent -->

개인적으로 예전부터 _"AI가 만들어낸 결과물을 어떻게 평가할까"_ 는 늘 풀리지 않는 의문이었습니다. RAG, Agent, Document AI 등의 서비스 ,제품을 볼 때, 평가 기준을 잡는 게 모델을 만드는 일 만큼이나 쉽지 않았던 기억이 있었습니다. 그래서 세계에서 가장 앞서 있는 모델들이 어떻게 평가받고 있는 지를 한 번 들여다보는 게 의미있는 정보가 될 것이라는 생각이 들었습니다.

이번 글에서는 그 평가의 주체인 vals.ai와, 그들이 만든 Finance Agent Benchmark(이하 `FAB`)를 차근차근 풀어보려고 합니다.

## vals.ai

vals.ai는 2023년 8월에 Stanford AI 석사 과정에 있던 Rayan Krishnan(CEO), Langston Nashold(CTO) 두 사람이 학교를 그만두고 만든 회사입니다. 본사는 샌프란시스코에 있고, 2024년 시드 라운드에서 약 $5M을 Sequoia Capital, Bloomberg Beta, Pear VC, 8VC 등으로부터 투자받았습니다.

자기 소개([vals.ai/about](https://www.vals.ai/about))에서 vals.ai는 스스로를 _"독립적인 Gen AI 벤치마크 플랫폼"_ 이라고 정의합니다. 회사를 시작한 이유로 네 가지를 들었는데, 그 중 가장 인상 깊었던 건 다음 한 줄입니다.

> _"Live leaderboards are often compromised. Researchers release datasets openly but this data is integrated into pre-training corpora…"_

공개된 벤치마크는 결국 모델의 사전학습 데이터에 흘러들어가 평가를 오염시키기 때문에 (이걸 보통 *dataset leakage(데이터 누출)*이라고 부릅니다), **데이터셋 자체를 비공개로 유지하면서 신뢰성 있는 평가를 만들겠다**는 것이 vals.ai의 핵심 차별점입니다. 이 한 줄이 뒤에서 살펴볼 `FAB`의 50/150/337 split 구조의 이유이기도 합니다.

<!-- IMG: vals.ai 홈페이지 또는 /about 페이지 상단 캡처 (회사 한 줄 정의 + 로고). 출처: https://www.vals.ai/about -->

vals.ai는 Finance Agent 하나만 만드는 회사가 아닙니다. 도메인별로 여러 벤치마크 라인업을 운영하고 있습니다.

| 영역       | 대표 벤치마크                                               |
| ---------- | ----------------------------------------------------------- |
| Finance    | `CorpFin`, `Finance Agent`, `TaxEval`, `Mortgage Tax`       |
| Legal      | `CaseLaw`, `ContractLaw`, `LegalBench`                      |
| Healthcare | `MedQA`, `MedScribe`, `MedCode`                             |
| Math       | `AIME`, `MGSM`, `SAGE`                                      |
| Academic   | `GPQA`, `MMLU Pro`, `ProofBench`                            |
| Coding     | `LiveCodeBench`, `SWE-bench Verified`, `Terminal-Bench 2.0` |
| Composite  | `Vals Index`, `Vals Multimodal Index`                       |

이 중에서 vals.ai 자신이 가장 비중 있게 가져가는 게 `Vals Index`라는 종합 지표인데, 그 산식이 이렇습니다.

```
Vals_Index = (2.0 × AVG(CorpFin, FinanceAgent) + 1.4 × Coding) / 3.4
```

쉽게 말해 Finance가 분자의 약 58.8%, Coding이 41.2%를 차지합니다. 왜 이렇게 가중치를 줬냐면 — vals.ai는 _"미국 GDP 기여도 기준"_ 이라고 밝힙니다. Finance가 약 $2T, Coding이 약 $1.4T 기여라고 보고 그 비율을 그대로 가져온 것입니다. 결국 vals.ai 입장에서도 _"AI가 만들어내는 가장 큰 경제적 임팩트는 금융"_ 이라는 가설을 깔고 있다는 뜻입니다.

그럼 본격적으로 그 `Finance Agent Benchmark`를 들여다보겠습니다.

### Finance Agent Benchmark

`FAB`는 총 537개의 문항으로 구성된 _"주니어 애널리스트 시뮬레이션"_ 입니다. vals.ai가 Stanford 출신 연구자 1인(Shirley Wu), 그리고 Goldman Sachs/JP Morgan 등 글로벌 IB·헤지펀드 출신 도메인 전문가 7명과 함께 설계했습니다. v1.1(2026년 초)에서는 AfterQuery라는 회사를 통해 Goldman Sachs, Silver Lake, Citadel 출신 전문가들이 데이터 QC를 한 번 더 거쳤습니다.

총 537개 문항은 9개 카테고리로 나뉘어 있습니다. 단순한 retrieval 문제부터 다단계 추론이 필요한 financial modeling까지, 모델이 어떤 능력에서 강하고 약한 지를 _능력별로 분리해서_ 측정하기 위해서입니다.

| #   | 카테고리                 | 정의(요약)                             | 난이도 | 문항수 | 비중 |
| --- | ------------------------ | -------------------------------------- | ------ | ------ | ---- |
| 1   | `Quantitative Retrieval` | 문서에서 숫자를 그대로 추출(가공 없음) | Easy   | 102    | 19%  |
| 2   | `Qualitative Retrieval`  | 문서에서 비수치 정보 인용·요약         | Easy   | 97     | 18%  |
| 3   | `Numerical Reasoning`    | 핵심 숫자들의 단순 계산·집계           | Easy   | 83     | 15%  |
| 4   | `Complex Retrieval`      | 복수 문서를 종합해 retrieval           | Medium | 29     | 6%   |
| 5   | `Adjustments`            | GAAP < > Non-GAAP 회계 조정 분석       | Medium | 43     | 8%   |
| 6   | `Beat or Miss`           | 가이던스 vs 실제 실적 비교             | Medium | 69     | 13%  |
| 7   | `Trends`                 | 한 회사의 KPI 추이 분석                | Hard   | 33     | 6%   |
| 8   | `Financial Modeling`     | 추가 가정·시나리오·다단계 회계 계산    | Hard   | 47     | 9%   |
| 9   | `Market Analysis`        | 복수 회사 비교, 사업 변화 인과 분석    | Hard   | 34     | 6%   |

난이도로 보면 Easy 282(52%) / Medium 141(27%) / Hard 114(21%) 입니다. 단순 retrieval이 절반 이상으로 가장 많고, Hard 카테고리(`Trends`, `Financial Modeling`, `Market Analysis`)가 약 1/5을 차지합니다.

여기서 한 가지 주의할 점이 있습니다 — vals.ai가 보고하는 최종 점수는 *카테고리별 정확도를 한 번 더 평균*한 값이라는 점입니다. 이걸 **Class-Balanced Accuracy(클래스 균형 정확도)** 라고 부릅니다. 만약 단순히 naive accuracy(전체 문항 평균)을 쓰면 Easy retrieval이 절반이 넘기 때문에, retrieval만 잘 하는 모델도 점수가 높게 나옵니다. 그래서 카테고리별로 한 번 평균을 내고, 그 9개 값을 다시 동일 가중으로 평균 — 이 방식으로 점수를 깎아낸 게 저희가 리더보드에서 보는 64.37%입니다.

<!-- IMG: vals.ai FAB 페이지의 9-category spider chart (모델별 카테고리 성능 분포). 출처: https://www.vals.ai/benchmarks/finance_agent -->

또 한 가지 중요한 건 537개 문항이 어떻게 *공개되는가*입니다. vals.ai는 이를 세 갈래로 쪼개놓았습니다.

```
Public split   :  50문항  → HuggingFace에 공개. 누구나 학습·검증용으로 사용 가능
Private split  : 150문항  → vals.ai 보관. 모델 선택·중간 검증용
Test split     : 337문항  → 영구 비공개. 리더보드 최종 점수의 근거
```

리더보드 페이지에 적힌 *"All results reported in this page are based solely on the Test set"* 이라는 한 줄이 이걸 뜻합니다. 리더보드 최종 점수의 근거는 영구 비공개인 Test 337문항이고, 외부에 노출되는 건 Public 50문항뿐입니다. **test 문항 자체가 공개되지 않는다**는 점이 dataset leakage에 대한 1차 방어선입니다. Public 50문항이 어떤 모델의 사전학습 데이터에 흘러들어가더라도, 리더보드가 실제로 측정하는 337개 *다른* 문항의 정답은 모델이 직접 암기할 수 없기 때문입니다.

vals.ai는 이 split 설계가 잘 작동하는지를 별도로 한 번 더 검증했습니다 — public split 점수와 test split 점수의 *모델 간 상관계수*가 Pearson r = 0.98로 나왔다는 것입니다. 같은 모델군을 두 split에서 평가했을 때, public에서 점수가 높은 모델은 test에서도 거의 같은 순위로 점수가 높다는 뜻입니다. 비공개 test에 접근할 수 없는 외부 연구자도 public 50문항만으로 모델을 신뢰성 있게 비교할 수 있다는 의미이지, *"public이 누출되어도 test 점수가 안 오른다"* 는 보장은 아닙니다. 누출에 대한 보장은 어디까지나 위에서 본 *"test를 영구 비공개로 둔다"* 는 split 자체에서 옵니다.

그럼 이제 한 단계 더 들어가서, 9개 카테고리 중에서도 가장 까다로운 `Financial Modeling` 한 카테고리를 골라 _"실제로 모델한테 무엇을 시키고, 어떻게 채점하는가"_ 를 끝까지 따라가보겠습니다. 이게 결국 가장 'Agent다운' 평가가 일어나는 영역이기 때문입니다.

### Finance Agent Evaluation - Data

`Financial Modeling` 카테고리는 vals.ai의 정의에 따르면 "'자체 가정(hypothesis) & 시나리오 수립 - 다단계(Multi-step) 회계 계산'이 결합된 정량 추론" 을 요구하는 문제 묶음입니다. 47개 문항 모두 Hard 난이도이고, 인간 전문가가 한 문제를 풀어내는 데 평균 16분, 최대 60분까지 걸린다고 합니다. 비용으로 따지면 한 문제당 약 $23.92(전문가 시간당 $91.4 추정)이 듭니다.

이 47개 문항 중 4개가 public split에 공개돼 있는데, 그 중에서도 가장 단순한 한 문항을 골라 끝까지 풀어보겠습니다. `Dutch Bros`(NASDAQ: BROS) 라는 미국 커피 체인의 2024년 10-K(연차보고서)를 기반으로 한 시나리오 모델링 문제입니다.

**문제 원문**:

> _"Assume BROS grows revenue by 30% CAGR and gross margins compress by 500bps from YE 2024. What is BROS gross profit in 2026? Round answer to nearest million."_

한국어로 의역하면 — _"`BROS`의 매출이 2024년 말부터 매년 30% CAGR로 성장하고, 매출총이익률은 500bps(=5%p)만큼 압축된다고 가정할 때, 2026년 매출총이익은 얼마인가? 가장 가까운 백만 단위로 반올림."_ 입니다. CAGR(Compound Annual Growth Rate, 연평균 성장률)과 bps(basis point, 1bp = 0.01%p)는 IB 실무에서 가장 흔히 쓰는 두 용어인데, 풀어 쓰니 비로소 문제가 일상어처럼 보입니다.

이 한 문장의 문제를 모델에게 던질 때, 모델이 받는 입력은 다음 네 가지입니다.

```
① Instruction prompt : 너는 financial agent다. 오늘은 4/7/25다.
                        주어진 도구로 답을 찾고, 최종 답은 'submit' tool로 제출하라.
                        소수점 둘째자리까지, 중간 계산은 반올림 금지.
② date pin(시점 고정)  : "Today is 4/7/2025" 가 system prompt에 박혀 있음
③ Tool 인터페이스     : 아래 5개 도구만 호출 가능
④ Question + Date    : 위 BROS 문제 텍스트
```

여기서 결정적인 건 ③의 도구 5개입니다. **모델에게는 어떤 참고 문서도 미리 주어지지 않습니다.** `BROS`의 10-K를 어디서 찾고, 어떻게 열고, 어디서 매출/매출원가 숫자를 뽑아낼지를 모델이 _직접_ 해결해야 합니다. '직접', '자율적으로' 모델이 판단하고 수행해야하기에 'Agent' Task이고, 'Agent Benchmark'로 부르게 되는 것입니다. 이게 `FinQA`나 `FinanceBench` 같은 기존 정적 QA 벤치마크와의 가장 큰 차이점입니다.

모델이 쓸 수 있는 도구 5개는 다음과 같습니다.

| 도구                   | 핵심 인자                                                         | 역할                                                   |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `web_search` (Tavily)  | `search_query`                                                    | 일반 웹검색. top-10 결과                               |
| `edgar_search`         | `query`, `form_types`, `ciks`(optional), `start_date`, `end_date` | SEC EDGAR에서 공시 메타데이터 검색                     |
| `parse_html_page`      | `url`, `key`                                                      | URL을 BeautifulSoup으로 파싱해 key-value 스토어에 저장 |
| `retrieve_information` | `prompt`(`{{key}}` placeholder 포함), `input_character_ranges`    | 저장된 문서를 sub-query로 다시 LLM에 물어 답 추출      |
| `submit`               | `final_answer`, `sources`                                         | 최종 답 제출. 이 호출이 일어나야 평가가 종료           |

특히 `parse_html_page`와 `retrieve_information` 두 도구가 *한 쌍처럼* 설계되어 있다는 점이 재밌습니다. `parse_html_page`가 어떤 문서를 파싱해서 *메모리 저장소*에 `key`로 저장하면, `retrieve_information`은 그 같은 `key`를 `{{key}}` placeholder로 받아 저장된 본문에 sub-query를 던집니다. 한쪽은 *문서를 적어두는 역할*, 다른 쪽은 *적힌 걸 다시 꺼내 묻는 역할*로, 같은 저장소를 공유하며 짝을 이룹니다.

이렇게 짝지어 둔 이유는 단순합니다. 10-K는 수백 페이지가 넘는 문서라 한 번에 모델 컨텍스트 윈도우에 다 들어가지 않습니다. 그래서 vals.ai는 *"파싱해서 저장 → 필요할 때마다 sub-query로 꺼내 쓰기"* 라는 패턴을 도구 인터페이스 차원에서 강제했습니다. 모델이 자기 컨텍스트를 *직접 관리하게* 만들어둔 셈입니다.

그럼 이 문제의 정답은 무엇일까요? `public.csv`에 기록된 정답은 **$467 million** 입니다. 그리고 이 정답을 채점하기 위한 _rubric(채점 기준표)_ 은 다음과 같이 생겼습니다.

```python
[{'operator': 'correctness',
  'criteria': 'BROS gross profit in 2026 is $467 million'},
 {'operator': 'contradiction',
  'criteria': '$467 million'}]
```

채점 항목이 단 두 개입니다 — _"답안에 'BROS gross profit in 2026 is \$467 million'이라는 핵심 개념이 정확하게 명시되었는가(correctness)?"_ 그리고 _"답안 어디에도 '\$467 million'과 모순되는 값이 등장하지 않는가(contradiction)?"_ 두 항목 모두 통과해야 1점, 하나라도 실패하면 0점입니다.

<!-- IMG: arXiv 2508.00828 Figure 2 — Vals 4-stage 평가 파이프라인 (Data Creation → Rubric Development → Agent Evaluation → Answer Grading). 출처: https://arxiv.org/abs/2508.00828 -->

즉 vals.ai는 모델에게 _"문제 한 줄 + 시점 + 도구함"_ 만 던지고, **답을 찾는 길은 모델이 알아서 짜라**는 방식을 택했습니다. 그래서 이게 'Agent' benchmark입니다.

### Finance Agent Evaluation - Process

이 문제를 잘 푸는 모델의 trajectory(풀이 동선)는, 마치 실제 주니어 애널리스트가 한 시간 동안 책상에 앉아 일하는 모습과 비슷합니다. 직원 한 명이 _"BROS 2024 10-K 좀 찾아서 매출이랑 매출원가 뽑아주세요"_ 라는 일을 받았을 때 머릿속에서 일어나는 과정을, 모델은 도구 호출로 _전사하듯이_ 보여줍니다.

`Claude Sonnet 4.5 (Thinking)` 기준의 모범 trajectory를 의사코드로 펼치면 이런 모양입니다.

```
[Step 1] edgar_search(
            query="Dutch Bros 10-K",
            form_types=["10-K"],
            start_date="2025-01-01",
            end_date="2025-04-07"
         )
         → BROS FY2024 10-K 메타데이터 (filing URL 포함)

[Step 2] parse_html_page(
            url="<BROS 2024 10-K URL>",
            key="bros_2024_10k"
         )
         → 메모리에 "bros_2024_10k"라는 key로 본문 저장

[Step 3] retrieve_information(
            prompt="From {{bros_2024_10k}}, give 2024 total revenue and
                    total cost of sales for gross profit calculation."
         )
         → 2024 revenue ≈ $1.28B,  gross margin ≈ 25.9%

[Step 4] [reasoning, 모델 내부 사고]
         2026 revenue  = 1.28B × (1.30)²        = 2.16B
         2026 GM       = 25.9% − 5.0%(=500bps)  = 20.9%
         2026 GP       = 2.16B × 20.9%          ≈ $452M
         → 반올림하면 약 $450~470M 범위

[Step 5] submit(
            final_answer="BROS의 2026년 추정 매출총이익은 약 $467 million입니다.
                          2024년 매출 $1.28B에 30% CAGR을 2년간 적용해 2026년
                          매출 $2.16B를 산출하고, 매출총이익률은 2024년 25.9%에서
                          500bps 압축한 20.9%를 적용했습니다.",
            sources=[{"url": "<10-K URL>", "name": "BROS 10-K 2024"}]
         )
```

다섯 단계 모두가 *외부적으로 관찰 가능한 도구 호출*로 남는다는 점이 중요합니다. 모델이 머릿속에서 무슨 생각을 하는지는 직접 볼 수 없지만, *어떤 문서를 어떤 순서로 열고, 무엇을 뽑아냈는지*는 trajectory가 그대로 기록합니다. 그래서 vals.ai는 단순 정확도 외에도 _평균 tool call 수_, _평균 turn 수_, _tool 별 사용 분포_ 까지 모두 점수와 함께 보고합니다.

여기서 한 가지 v1.1에서 새로 추가된 디테일이 있습니다 — 시스템 프롬프트에 _"give answers to two decimal places and not round any intermediate calculations"_ 라는 한 줄이 박혀 있다는 점입니다. v1.0 시절에는 모델마다 반올림 시점이 달라서 _답은 비슷한데 자릿수 때문에 0점_ 처리되는 경우가 있었습니다. v1.1은 이를 prompt 수준에서 통일했습니다. 작은 디테일 같지만, 평가 일관성에는 결정적입니다.

> 결국 `FAB`가 측정하는 건 _"답을 맞췄나"_ 가 아닙니다. _"답을 찾아가는 길을 모델이 스스로 설계했나"_ 입니다. 도구함만 주어진 상황에서 어떤 순서로 무엇을 호출할지, 중간에 실패하면 어떻게 복구할지 — 이 일련의 의사결정이 점수의 본질입니다. 이게 'Agent benchmark'라는 이름이 붙은 이유입니다.

### Finance Agent Evaluation - Result Aggregation

모델이 `submit`을 호출하면, 그 답안 텍스트가 *채점관*에게 넘어갑니다. 이 채점관도 LLM입니다. v1.1 기준으로는 `GPT-5.2`가 채점을 맡고, 이걸 보통 _LLM-as-judge(한국어로 굳이 의역하자면.. 'LLM 채점자')_ 라고 부릅니다.

왜 사람이 아니라 LLM이 채점할까요? `FAB`의 답안은 자유서술형입니다. _"BROS의 2026년 추정 매출총이익은 약 \$467M입니다"_ 라고 적은 답과 _"2026년 GP ≈ 467 million USD"_ 라고 적은 답을 *같은 정답*으로 처리하려면 단순 문자열 매칭으로는 불가능합니다. 그래서 LLM이 *의미 기준*으로 두 표현이 같은지 판단해야 합니다.

채점은 위에서 본 두 개의 rubric 항목 각각에 대해 독립적으로 일어납니다. 그리고 v1.1부터는 _judge를 한 번이 아니라 세 번_ 호출해서 다수결로 결정합니다. 이걸 **mode-of-3 voting(3회 다수결 투표)** 이라고 부릅니다 — 같은 채점자 세 명이 서로 모르게 채점한 뒤 다수결로 통과/실패를 정한다고 이해하시면 됩니다. judge 모델 판단의 variance(분산)를 줄이기 위한 장치입니다.

집계 흐름은 결국 다음 4단계입니다.

```
[rubric 항목]   correctness 통과(2/3 이상 = 다수결 통과)  AND  contradiction 통과(2/3 이상 = 다수결 통과)
       ↓
[문항 점수]     모든 rubric 항목이 통과 → 1점,  하나라도 실패 → 0점
       ↓
[카테고리 점수]   카테고리 내 문항 정확도의 평균
                (BROS 문제는 Financial Modeling 47문항 중 1/47 가중치로 반영)
       ↓
[최종 점수]     9개 카테고리 평균을 다시 동일 가중으로 평균
                = Class-Balanced Accuracy (= 리더보드의 64.37%)
```

여기서 _모든 rubric 항목이 통과_ 라는 조건이 단순해 보이지만 꽤 매정합니다. 부분점수가 없기 때문입니다. 60분짜리 expert 문제도, 모델이 풀이의 99%를 잘 짜놓고 마지막 한 step에서 틀리면 _0점_ 으로 기록됩니다. 이걸 **GAIA-style binary scoring(이진 채점)** 이라고 부릅니다.

마지막으로 vals.ai 리더보드는 정확도 한 줄만 보여주는 게 아닙니다. 보조 지표로 다음을 함께 보고합니다.

- _Cost per test_ (문제당 모델 비용)
- _Latency_ (평균 응답 시간)
- _Tool calls_ (평균 도구 호출 횟수)
- _Naive accuracy_ (Class-Balanced이 아닌 단순 평균)

이 보조 지표들이 같이 있어야 비로소 _"이 모델은 정확하지만 비싸다"_, _"이 모델은 빠르지만 도구 호출이 적어 retrieval에 약하다"_ 같은 trade-off가 보입니다. 단순 정답률 한 줄이 아니라 능력을 9갈래로 쪼개고 비용·속도까지 같이 본다는 점이 — `FAB`가 이름 그대로 '벤치마크'를 넘어 '평가 인프라'로 자리잡은 이유일 것 같습니다.

### Finance Agent Benchmark Limitation

여기까지 보면 `FAB`는 거의 빈틈없어 보이지만, 실제로 들여다보면 몇 가지 한계가 분명히 있습니다. 이 한계들은 저희가 한국 시장에 맞춰 평가체계를 새로 짠다면 _반드시 보완해야 할 지점_ 들이기도 합니다.

**1. 풀이 누락 페널티**

공개된 input만 봐서는 rubric에 어떤 atomized(원자화된, 세분화된) 항목(위 내용 중 'operator'의 'criteria' 항목)이 들어가 있는지 알 수 없습니다. 모델이 정답을 _암산으로_ 맞춰도, rubric이 요구하는 중간 숫자(예: TSMC 분기 예측 문제의 _"Feb→Mar growth rate 17%"_)를 답안 텍스트에 명시하지 않으면 0점이 됩니다. v1.1에서 _"supporting reasoning과 evidence를 답안에 포함하라"_ 로 prompt를 강화하긴 했지만, 결국 _"모델은 풀이 과정을 텍스트로 다 적어야만 점수를 받는다"_ 는 본질적 제약은 그대로 남아 있습니다.

**2. SEC·영문 편중**

모든 문항이 `EDGAR`(미국 증권거래위원회 공시 시스템)와 영문 자료에 의존합니다. 한국의 `DART`, 일본의 `EDINET`처럼 비영어권 공시는 평가 범위에 들어가지 않습니다. 한국 증권사가 _"국내 종목 기반 초개인화 투자관리 Agent"_ 를 평가해야 한다면, 이 부분은 그대로 차용이 불가능합니다.

**3. 정적·단일 정답**

`FAB`는 _"답이 정해진 한 시점의 분석"_ 만을 다룹니다. 4/7/2025라는 고정 시점에서 모든 문제가 일관된 단일 정답을 갖습니다. 하지만 실제 투자관리는 시계열, 실시간성, 복수정답이 본질입니다. 같은 _"삼성전자를 사야 할까"_ 라는 질문도 매 분기마다 정답이 바뀝니다. 후속 벤치마크인 `TraderBench` 같은 작업이 _"FAB조차도 실은 tool-augmented retrieval일 뿐 trading benchmark는 아니다"_ 라고 비판하는 지점도 여기입니다.

**4. Judge prompt의 비공개**

rubric을 *생성* 할 때 쓴 prompt는 논문 부록 A.1에 공개돼 있지만, rubric을 실제로 *적용해 채점할 때* 쓴 judge prompt의 원문은 공개돼 있지 않습니다. 재현·외부 검증이 어렵다는 뜻이고, 결과적으로 *"속이 들여다보이지 않는 채점관"* 이 점수를 결정하는 구조가 됩니다. 실무적으로는, 외부 연구자가 `public.csv`로 자체 평가를 돌리려면 — rubric 항목과 §2.2의 operator 정의, mode-of-3 voting 구조를 가지고 — **judge prompt를 본인이 직접 재구성**해야 한다는 의미이기도 합니다.

**5. Binary scoring의 거친 입자도**

이미 한 번 짚었지만 다시 강조해둘 만한 한계입니다. 60분짜리 expert 문제도 0/1로만 기록됩니다. 80%를 잘 풀고 마지막 한 step에서 틀려도 0점입니다. 모델 간 변별력을 위해서는 합리적인 선택일 수 있지만 — 실무 평가에서 _"얼마나 잘 풀었는지"_ 의 quality를 측정해야 한다면, 이 binary는 너무 거칠어 보입니다.

---

지금까지 'Finance Agent'라는 영역에서 가장 영향력있는 Benchmark로 꼽히는 'val.ai FAB'에 대해 구체적으로 살펴보았습니다. 앞으로 이 외에도 다양한 Vertical Agent의 평가 방법론, 데이터셋, 벤치마크 프레임워크 등이 나올 것으로 보입니다. 관심있게 트래킹하면서 인사이트를 얻고, 일상이나 업무에서도 활용할 수 있다면 좋을 것 같습니다.

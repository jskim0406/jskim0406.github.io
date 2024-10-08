---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - (1) `keyword`
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-07 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```plaintext
{
	"mappings": {
		"properties": {
			"region": {
				"type": "keyword"
			}
		}
	}
}

{
  "properties": {
    "email": {
      "type": "keyword",
      "fields": {
        "lowercase": {
          "type": "keyword",
          "normalizer": "my_lowercase_normalizer"
        }
      }
    }
  }
}

{
  "properties": {
    "gender": {
      "type": "keyword",
      "null_value": "알 수 없음"
    }
  }
}

PUT car-master.static.constant_keyword
{
	"mappings": {
		"properties": {
			"source": {
				"type": "constnat_keyword",
				"value": "News Agency 1"
			}
		}
	}
}

{
  "properties": {
    "model_number": {
      "type": "wildcard"
    }
  }
}
```

## 필드 데이터 타입 종류
Elasticsearch에 사용되는 필드 데이터 타입은 크게 3가지로 나뉠 수 있습니다.
1. 지형 데이터 타입
	- `geo_point`
	- `geo_shape`
2. 계층 구조 데이터 타입
	- `Object`
	- `Nested`
3. 일반 데이터 타입
	- `keyword`, `text`
	- `date`
	- `long`, `double`, `integer`, ..
	- `boolean`, `ip`
각각의 데이터 타입은 모두 저마다의 특징을 갖고 있습니다. 데이터 저장 시 적절한 타입으로 mapping해주는 것이 필요합니다.
아래에서 필드 데이터 타입 중 **문자열 데이터 타입 유형**에 대해 먼저 살펴보겠습니다.

## 문자열 데이터 타입 유형
- 문자열은 `keyword`, `text` 타입으로 보통 매핑됩니다. 색인 전에 각 데이터 별로 이러한 매핑 타입을 사전에 정의해놓고, 정적 매핑으로 색인을 진행하는 것이 필요합니다.
- 정적 매핑이 색인 과정에서 쓰기 작업에 필요한 공간을 절약하고, 쓰기 속도를 높일 수 있기 때문입니다.

### 문자열 데이터 타입 유형 (1) `keyword`
```plaintext
{
	"mappings": {
		"properties": {
			"region": {
				"type": "keyword"
			}
		}
	}
}
```
- 입력된 문자를 하나의 토큰으로 저장
- 검색 시 입력된 문자와 동일한 문자가 입력되어야 검색됨
- cafe, Cafe, Café는 다른 문자로 인식하여 cafe 검색 시 3개의 문서가 전체 검색되지 않음

#### `Keyword` 타입의 필요성
일반적으로 검색 엔진은 데이터를 색인할 때 텍스트를 분석하여 토큰화합니다. 예를 들어, "Blue Sky"라는 문자열을 분석하면 "blue"와 "sky"라는 두 개의 토큰으로 분리될 수 있습니다. 이 과정에서 소문자 변환, 불용어 제거, 어근 추출 같은 여러 처리를 할 수 있습니다. 하지만 모든 경우에 이런 분석이 유리한 것은 아닙니다. 때로는 문자열을 정확하게, 변경 없이 저장하고 검색하고 싶은 경우가 있습니다. 이때 사용하는 것이 `keyword` 타입입니다.

#### `Keyword` 타입의 특징
- **분석기 미사용**: 입력된 데이터를 그대로 색인합니다.
- **공백 및 대소문자 구분**: "Email"과 "email"을 다른 데이터로 취급합니다.
- **정확한 매칭**: 정확한 텍스트 매칭이 필요할 때 유용합니다.

#### `Keyword` 주요 사용 사례
1. **이메일, 태그, 카테고리**: 이메일 주소나 태그 같은 메타데이터는 정확한 문자열 매칭이 중요합니다.
2. **정렬 필요 항목**: 사용자 목록의 성(surname)이나 이름 같은 필드에서 정렬을 수행할 때 정확한 문자열 기반으로 정렬해야 합니다.
3. **집계(Aggregation) 필요 항목**: 특정 카테고리별로 데이터를 집계할 때도 원본 문자열 기반의 정확한 집계가 필요합니다.

#### `Keyword` 관련 필드 타입
- **constant_keyword**: 불변의 값을 갖는 필드에 사용하며, 색인 시간과 공간을 절약할 수 있습니다.
- **wildcard**: 패턴 매칭이 필요할 때 사용하며, "\*" 와 "?" 같은 와일드카드 문자를 허용합니다.
이러한 특성 때문에 `keyword` 타입은 로깅 시스템, 이메일 서비스, 문서 관리 시스템 등에서 널리 사용됩니다.

####  `keyword` 필드 타입의 주요 매개 변수

##### 1. `normalizer`
데이터를 색인할 때 때로는 모든 입력을 동일한 형태로 표준화하여 저장하고 싶을 수 있습니다. 예를 들어, "cafe", "Cafe", "Café"와 같이 다르게 입력되는 단어들을 모두 "cafe"로 통일하여 색인하고자 할 때 이를 가능하게 하는 기능이 필요합니다. 이런 경우, 검색 엔진에서는 "normalizer"라는 기능을 사용하여 이를 구현할 수 있습니다.

###### **Normalizer란 무엇인가?**
Normalizer는 검색 엔진에서 keyword 타입의 필드에 사용될 수 있는 텍스트 전처리 도구입니다. 이는 분석기(analyzer)와 비슷한 역할을 하지만, 형태소 분석을 수행하지 않고 문자열을 사전 처리(pre-processing)하는 데 집중합니다. Keyword 타입은 기본적으로 입력된 문자열을 그대로 색인하지만, normalizer를 사용하면 이 문자열에 간단한 변형을 적용할 수 있습니다.

###### **Lowercase Filter를 사용하는 Normalizer**
예를 들어, "cafe", "Cafe", "Café" 모두를 "cafe"로 색인하려면, 입력된 문자열을 소문자로 변환하고, 악센트(accent)를 제거하는 처리가 필요합니다. 이를 위해 "lowercase filter"를 사용하는 normalizer를 정의할 수 있습니다. 이 normalizer는 다음 두 가지 주요 작업을 수행합니다:
	- **Lowercase Filter**: 모든 대문자를 소문자로 변환합니다. 예를 들어, "Cafe"는 "cafe"로 변환됩니다.
	-  **ASCII Folding Filter** (필요한 경우): 악센트가 있는 문자를 해당하는 ASCII 문자로 변환합니다. 예를 들어, "Café"의 'é'는 'e'로 변환됩니다.
이렇게 정의된 normalizer는 keyword 타입의 필드에 적용되어 입력된 모든 변형을 "cafe"라는 동일한 형태로 색인할 수 있게 해 줍니다. 이는 사용자가 다양한 방식으로 데이터를 입력하더라도 검색 시 일관된 결과를 제공하는 데 도움을 줍니다.

##### 2. `doc_values`
`doc_values`는 Elasticsearch와 같은 검색 엔진에서 매우 중요한 개념으로, 특히 정렬(sorting), 집계(aggregation) 및 스크립팅(scripting) 작업을 최적화하기 위해 사용됩니다. 이 시스템은 열 기반(columnar) 저장 구조를 활용하여, 필드 데이터를 디스크 상에서 효율적으로 저장하고 관리합니다. 

###### **열 기반 저장 구조의 장점**
전통적인 데이터베이스 시스템이나 검색 엔진은 데이터를 행(row) 기반으로 저장합니다. 행 기반 저장 구조는 각 행에 속한 모든 데이터를 연속적으로 저장하여, 특정 레코드의 모든 정보에 빠르게 접근할 수 있는 장점이 있습니다. 그러나, 특정 필드만을 대상으로 작업을 할 때는 필요하지 않은 데이터도 함께 로드해야 하므로 비효율적일 수 있습니다.

반면, 열 기반 저장 구조는 각 필드의 데이터를 별도의 열로 저장합니다. 이 구조는 특히 대량의 데이터를 필드별로 빠르게 읽어야 할 때, 즉 정렬이나 집계 같은 연산에서 매우 효율적입니다. 데이터의 일부만을 불러오면 되기 때문에 필요한 데이터만 메모리에 로드하면 되므로, 처리 속도가 향상됩니다.

###### **`doc_values`의 역할**
`doc_values`는 이러한 열 기반 데이터 구조를 활성화하여 각 필드의 데이터를 디스크에 저장하는 옵션입니다. `doc_values`가 활성화된 필드는 다음과 같은 작업을 위해 최적화됩니다:
- **정렬(Sorting)**: 여러 문서들을 특정 필드의 값에 따라 순서대로 배열할 때, `doc_values`는 필요한 필드의 데이터만 빠르게 접근하여 정렬을 수행합니다.
- **집계(Aggregation)**: 대량의 데이터에 대한 요약, 평균, 최대값 등을 계산할 때, 필드별로 저장된 데이터를 기반으로 빠르게 연산을 수행할 수 있습니다.
- **스크립팅(Scripting)**: 사용자 정의 스크립트에서 특정 필드 데이터를 사용할 때, `doc_values`는 필요한 데이터를 효과적으로 제공합니다.
`doc_values`는 기본적으로 대부분의 필드 유형에서 활성화되어 있으며, 특히 대용량 데이터를 다루는 환경에서 그 성능 향상이 두드러집니다. 필드 설정을 통해 `doc_values`를 비활성화할 수도 있지만, 이는 데이터 처리 성능 저하를 초래할 수 있으므로 주의가 필요합니다.

##### 3. `boost`
`boost`는 검색 엔진에서 특정 필드의 중요도를 조절하기 위해 사용되는 기능입니다. 이 기능을 통해 개발자나 검색 엔진 최적화(SEO) 전문가는 문서 내의 특정 필드가 검색 결과에서 얼마나 영향을 미칠지를 조정할 수 있습니다. `boost`를 사용하면 특정 필드에 가중치를 부여하여 그 필드의 중요성을 인위적으로 높일 수 있습니다.

###### **`boost`의 작동 방식**
검색 엔진은 사용자의 쿼리와 문서의 필드를 비교하여 유사도 점수(similarity score)를 계산합니다. 이 점수는 문서가 사용자의 검색 쿼리와 얼마나 잘 맞는지를 나타내며, 점수가 높을수록 검색 결과 상단에 위치하게 됩니다. `boost`를 적용하면 특정 필드의 유사도 점수에 가중치를 적용하여, 그 필드가 결과에 미치는 영향을 강화할 수 있습니다.
예를 들어, 검색 엔진에서 "베스트 커피숍"이라는 쿼리에 대해, 'title' 필드에 높은 `boost` 값을 설정하면, 'title' 필드에 "커피숍"이라는 단어가 포함된 문서의 유사도 점수가 상대적으로 더 많이 올라갑니다. 결과적으로, 해당 단어를 'title'에 포함한 문서가 검색 결과에서 더 높은 위치를 차지하게 됩니다.

###### **`boost`의 적용 예**
- **title 중요도 강조**: 'title' 필드에 높은 `boost` 값을 설정하여 제목의 콘텐츠가 검색 결과에 더 큰 영향을 미치도록 합니다.
- **특정 콘텐츠 강조**: 제품 리뷰나 사용자 리뷰 같은 특정 내용이 포함된 필드에 `boost`를 적용하여, 이러한 정보를 중요시하는 검색에서 해당 문서의 순위를 높일 수 있습니다.
- **키워드 특화 검색**: 특정 키워드가 중요한 역할을 하는 검색 상황에서는 그 키워드가 포함된 필드에 추가 가중치를 줘서 해당 문서의 노출 빈도와 순위를 높일 수 있습니다.
`boost`는 검색 결과의 정확성과 관련성을 향상시키는 데 유용한 도구입니다. 하지만 이를 지나치게 사용하면 중요하지 않은 문서가 과도하게 부각될 위험이 있으므로, 적절한 균형을 유지하는 것이 중요합니다. 사용자의 검색 경험을 최적화하기 위해 `boost` 값을 실험적으로 조정하고, 검색 품질에 미치는 영향을 지속적으로 모니터링하는 것이 좋습니다.

##### 4. `field`
Elasticsearch에서 `keyword` 필드 타입은 텍스트 데이터를 분석 없이 정확히 저장하고 검색할 수 있도록 설계된 데이터 유형입니다. 이 필드 타입은 특히 정확한 텍스트 매칭, 정렬, 집계 작업에 적합하며, 사용자가 입력한 정확한 텍스트를 기반으로 작업을 수행합니다. 그러나 때로는 동일한 데이터에 대해 다른 분석 방법을 적용하고 싶을 때가 있습니다. 이를 위해 `keyword` 필드 타입에서는 `field` 매개변수를 사용하여 하위 필드(sub-fields)를 정의할 수 있습니다. 
`keyword` 타입의 필드에서 하위 필드의 사용은 주로 텍스트의 변형이 아니라, 데이터의 저장 및 검색 방식에 초점을 맞춥니다. `keyword` 타입은 자체적으로 데이터를 분석하지 않고 원본 텍스트를 그대로 사용하지만, 특정한 정규화 또는 변환을 적용해야 할 때 하위 필드를 설정할 수 있습니다.

###### **하위 필드(Sub-fields) 정의의 중요성**
하위 필드를 정의하는 것은 하나의 필드에 대해 다양한 검색 및 분석 요구사항을 수용하고자 할 때 유용합니다. 예를 들어, 사용자가 입력한 문자열을 기본적으로는 그대로 색인하지만, 특정 쿼리에서는 이 데이터를 다른 방식으로 분석하고 싶은 경우가 있습니다.

###### **하위 필드 사용 예**
예를 들어, `keyword` 필드로 저장된 `email` 필드가 있을 때, 이 필드를 대소문자 구분 없이 검색하고 싶은 경우가 있을 수 있습니다. 이를 위해 `email` 필드의 하위 필드로 `email.lowercase`를 추가하고, 이 하위 필드에 `lowercase` 분석기를 적용할 수 있습니다. 이렇게 하면 원본 `email` 필드는 기본적인 `keyword` 기능을 유지하면서, `email.lowercase` 필드를 통해 소문자로만 구성된 이메일 주소로 검색할 수 있습니다.

###### **기술적 구현**
```plaintext
{
  "properties": {
    "email": {
      "type": "keyword",
      "fields": {
        "lowercase": {
          "type": "keyword",
          "normalizer": "my_lowercase_normalizer"
        }
      }
    }
  }
}
```
위의 예에서, `email` 필드는 기본적으로 `keyword` 타입으로 설정되어 있으며, `fields` 매개변수를 사용하여 `lowercase`라는 하위 필드를 추가하고 있습니다. `lowercase` 필드에는 `my_lowercase_normalizer`라는 정규화기가 설정되어 있어서, 이 필드를 통한 검색은 입력된 텍스트를 소문자로 변환하여 처리합니다. 이는 대소문자를 구분하지 않고 일관된 검색 결과를 제공하고자 할 때 유용합니다.

하위 필드를 사용함으로써, 동일한 데이터에 대해 다양한 검색 및 분석 방법을 적용할 수 있습니다. 이는 Elasticsearch를 사용하는 많은 애플리케이션에서 유연성과 검색 최적화를 제공하는 데 매우 중요한 기능입니다. 이를 통해 개발자는 사용자의 다양한 검색 요구를 보다 효과적으로 충족시킬 수 있습니다.

##### 5. `null_value`
`null_value` 옵션은 Elasticsearch에서 필드가 `null` 값을 갖는 경우, 이를 어떤 특정한 값으로 대체하여 색인하는 기능을 제공합니다. 이 설정을 사용하면, 데이터가 누락되었거나, 필드 값이 주어지지 않은 경우에도 검색이나 집계에서 일관된 결과를 얻을 수 있습니다. `null_value` 옵션은 특히 로깅, 데이터 수집 또는 사용자 입력에서 일부 데이터가 빠져 있을 때 유용하게 사용할 수 있습니다.

###### **`null_value` 옵션의 작동 방식**
문서의 특정 필드 값이 `null` 또는 제공되지 않았을 경우, `null_value`에 설정된 값으로 자동 대체되어 색인됩니다. 이렇게 하면 검색 쿼리 실행 시 해당 필드에 대해 설정된 대체 값으로 검색을 할 수 있으므로, 데이터의 누락 없이도 일관된 검색 결과를 보장할 수 있습니다.

###### **`null_value` 사용 예**
예를 들어, 어떤 사용자의 데이터베이스에 '성별' 필드가 있는데, 몇몇 사용자는 이 필드의 정보를 제공하지 않았다고 가정해봅시다. 이 경우, `null_value` 옵션을 사용하여 누락된 '성별' 필드를 "알 수 없음"으로 설정할 수 있습니다. 이렇게 하면 성별 정보가 없는 사용자도 "알 수 없음" 값으로 색인되어, 성별 필드에 대한 집계나 검색을 할 때 모든 사용자가 포함됩니다.
```plaintext
{
  "properties": {
    "gender": {
      "type": "keyword",
      "null_value": "알 수 없음"
    }
  }
}
```
위의 설정에서, 'gender' 필드가 `null`일 경우 "알 수 없음"으로 대체되어 색인됩니다. 이 설정을 통해 'gender' 필드가 빈 사용자에 대한 검색이나 데이터 집계를 수행할 때 '알 수 없음'이라는 값으로 포함시킬 수 있습니다.

`null_value` 옵션은 데이터 누락이 자주 발생하거나, 필드 값이 일부만 존재하는 데이터 세트에서 특히 유용합니다. 이를 통해 데이터의 일관성과 검색 결과의 정확성을 향상시키며, 모든 사용자에 대한 공정한 데이터 처리를 보장할 수 있습니다. 사용하는 동안 데이터의 실제 누락을 인지하고 이를 관리하는 것이 중요합니다, 왜뜻 데이터의 질적 측면을 보장하기 위해 실제로 누락된 정보의 원인을 분석하는 것이 필요할 수 있습니다.

### 문자열 데이터 타입 유형 (2) `keyword` - `constant_keyword` 타입
- 색인 시 모든 문서가 동일한 값을 색인, 필터링 속도를 높이는데 사용

`constant_keyword` 타입은 Elasticsearch에서 최적화된 데이터 처리를 위해 사용되는 특수한 필드 유형입니다. 이 필드 유형은 모든 문서에서 같은 값을 갖는 필드를 처리할 때 사용되며, 주로 색인 공간을 절약하고 쿼리 성능을 향상시키기 위해 사용됩니다.

#### **`constant_keyword` 타입의 특징**
`constant_keyword` 타입은 한 색인 내 모든 문서에서 동일한 값을 갖는 필드에 사용됩니다. 즉, 이 필드 유형은 한 번 설정되면 모든 문서에 대해 같은 값을 공유하게 됩니다. 이러한 특성 때문에 색인 시간과 저장 공간이 효율적으로 사용됩니다. 또한, 집계(aggregations)나 필터링(filtering) 같은 작업에서 매우 빠른 성능을 제공합니다.

#### **`constant_keyword` 타입의 사용 예**
예를 들어, 여러분이 뉴스 기사를 색인하는 시스템을 운영하고 있고, 모든 문서가 같은 출처("News Agency")에서 제공되었다고 가정해 보겠습니다. 이 경우, 각 기사의 출처 필드를 `constant_keyword`로 설정할 수 있습니다.
```plaintext
PUT car-master.static.constant_keyword
{
	"mappings": {
		"properties": {
			"source": {
				"type": "constnat_keyword",
				"value": "News Agency 1"
			}
		}
	}
}
```
위 설정에서 `source` 필드는 모든 문서에 대해 "News Agency"라는 값을 자동으로 갖게 됩니다. 문서를 색인할 때 `source` 필드를 별도로 지정할 필요가 없으며, 이 값은 자동으로 적용됩니다.

#### **`constant_keyword` 타입의 이점**
1. **저장 공간 절약**: 각 문서에 동일한 값을 저장할 필요가 없기 때문에 색인 크기가 줄어듭니다.
2. **색인 성능 향상**: 모든 문서가 같은 값을 갖기 때문에 색인 과정이 더 빠르고 간단해집니다.
3. **쿼리 최적화**: 집계나 필터링 작업에서 `constant_keyword` 필드는 이미 알려진 고정 값으로 처리되므로, 성능이 향상됩니다.
4. **단순화된 쿼리**: 사용자가 이 필드를 쿼리할 때 별도의 값 지정 없이도 동일한 결과를 얻을 수 있어, 쿼리 구성이 단순해집니다.

`constant_keyword` 타입은 모든 문서에서 공통적인 속성을 갖는 데이터를 처리할 때 매우 유용하며, 성능 및 저장 공간 측면에서 큰 이점을 제공합니다. 이는 특히 로그 데이터나 동일한 속성을 공유하는 문서들을 색인 할 때 유용하게 사용될 수 있습니다.

### 문자열 데이터 타입 유형 (3) `keyword` - `wildcard` 타입
`wildcard` 타입은 Elasticsearch에서 텍스트 필드를 더 유연하게 색인하고 검색할 수 있게 해주는 특수 필드 유형입니다. 이 필드 유형은 문자열에서 부분 일치 검색을 효과적으로 수행할 수 있도록 설계되었으며, 특히 와일드카드 문자(`*`, `?`)를 사용한 검색에서 강력한 성능을 제공합니다.

##### **`wildcard` 타입의 특징**
`wildcard` 필드 타입은 문자열 데이터를 색인할 때 n-gram 접근 방식과 비슷한 방식을 사용하여 데이터를 색인합니다. 이 방식은 전체 필드 값을 저장하는 대신, 필드 내용을 부분적으로 나누어 저장함으로써, 부분 일치 검색을 효율적으로 수행할 수 있게 합니다. 이러한 특징 덕분에, 사용자가 와일드카드 검색을 실행할 때, 매우 빠르고 정확하게 결과를 반환할 수 있습니다.

##### **`wildcard` 타입의 사용 예**
예를 들어, 사용자가 IT 제품의 모델 번호를 검색할 때, 모델 번호의 전체를 정확히 기억하지 못하는 경우가 많습니다. **사용자가 "XYZ*" 또는 "123?45"와 같이 입력할 때**, `wildcard` 필드 타입을 사용하면 이러한 쿼리에 대해 효과적으로 대응할 수 있습니다.
```plaintext
{
  "properties": {
    "model_number": {
      "type": "wildcard"
    }
  }
}
```
위 설정에서 `model_number` 필드는 `wildcard` 타입으로 설정되어 있습니다. 이 설정은 사용자가 모델 번호의 일부만을 알고 있을 때도 해당 부분을 포함하는 모든 문서를 찾을 수 있게 해줍니다.

##### **`wildcard` 타입의 이점**
1. **부분 일치 검색**: 사용자가 데이터의 일부만 알고 있을 경우에도 해당 부분을 포함하는 모든 데이터를 찾아낼 수 있습니다.
2. **유연한 쿼리**: 와일드카드 문자를 사용한 쿼리를 통해 다양한 검색 패턴을 손쉽게 구현할 수 있습니다.
3. **성능 최적화**: 텍스트를 효율적으로 색인하고 검색하기 위해 설계된 `wildcard` 타입은 큰 데이터 세트에서도 빠른 검색 성능을 제공합니다.
4. **고급 검색 시나리오 지원**: 로그 분석, 제품 검색, 문서 관리 등 다양한 응용 프로그램에서 복잡한 검색 요구를 충족할 수 있습니다.

`wildcard` 필드 타입은 특히 검색어의 일부만을 활용하는 검색 시나리오에서 강력한 성능을 발휘합니다. 이는 사용자가 데이터의 일부 정보만 가지고 있어도 관련 정보를 효과적으로 찾아낼 수 있도록 도와줍니다.
---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - (2) `text`
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
				"type": "text"
			}
		}
	}
}

{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": {
          "type": "custom",
          "tokenizer": "nori_tokenizer"
        }
      }
    }
  }
}

{
  "properties": {
    "content": {
      "type": "text",
      "analyzer": "standard",  // 색인 시 사용
      "search_analyzer": "korean"  // 검색 시 사용
    }
  }
}

{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "english",
      "search_analyzer": "standard"
    }
  }
}

PUT /your_index/_mapping
{
  "properties": {
    "your_text_field": {
      "type": "text",
      "fielddata": true
    }
  }
}

{
  "properties": {
    "your_text_field": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    }
  }
}

{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "standard",
      "search_analyzer": "synonym_analyzer"
    }
  }
}

PUT /my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_synonym_filter": {
          "type": "synonym",
          "synonyms_path": "analysis/synonyms.txt"  // 동의어 파일 경로
        }
      },
      "analyzer": {
        "synonym_analyzer": {
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "my_synonym_filter"
          ]
        }
      }
    }
  }
}

PUT /my_index/_mapping
{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "standard",  // 색인 시 사용하는 기본 분석기
      "search_analyzer": "synonym_analyzer"  // 검색 시 사용하는 분석기
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

### 문자열 데이터 타입 유형 (4) `text`
```plaintext
{
	"mappings": {
		"properties": {
			"region": {
				"type": "text"
			}
		}
	}
}
```
검색 엔진이나 특정 데이터베이스 시스템에서 사용자가 입력한 텍스트를 어떻게 처리하고 검색 결과를 어떻게 반환하는지는 매우 중요합니다. 특히 Elasticsearch와 같은 시스템에서는 `text` 필드 타입을 통해 이러한 작업이 이루어집니다. `text` 필드 타입과 이와 관련된 분석기(analyzer)에 대해 자세히 알아보겠습니다.

###  `text` 필드 타입의 기본 작동 원리
`text` 필드 타입은 입력된 전체 텍스트를 개별 단어(토큰)로 분리하여 검색할 수 있도록 합니다. 이 과정은 분석기라고 하는 특수 도구를 통해 이루어지며, 텍스트에서 유의미한 검색어를 추출하는 데 필수적입니다.

####  `text` 필드 타입 예시
- **텍스트**: "볼보XC60"
- **토큰화 결과**: ["볼보", "XC60"]
이렇게 토큰화된 결과 덕분에 사용자가 "볼보" 또는 "XC60"과 같은 단어만을 검색해도 관련 있는 문서를 찾을 수 있습니다. 이는 검색 엔진이 텍스트의 전체가 아닌 일부분만을 포함해도 해당 문서를 검색 결과로 반환할 수 있게 해줍니다.

#### 분석기의 역할과 설정
분석기는 텍스트를 토큰화할 뿐만 아니라, 토큰을 생성, 필터링, 변환하는 역할을 합니다. Elasticsearch는 기본적으로 `standard analyzer`를 사용하지만, 특정 언어나 요구 사항에 맞게 다른 분석기를 사용할 수도 있습니다.

#### 한글 형태소 분석기 설정 예
한글 텍스트를 처리할 때는 한글에 최적화된 형태소 분석기를 사용할 수 있습니다. 예를 들어, 한글을 처리하는 데 특화된 'nori' 분석기를 설정하여 더 정확한 토큰화와 검색을 수행할 수 있습니다.
```plaintext
{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": {
          "type": "custom",
          "tokenizer": "nori_tokenizer"
        }
      }
    }
  }
}
```

#### 색인 분석기와 검색 분석기의 구분
Elasticsearch에서는 문서를 색인할 때 사용하는 분석기와 검색 쿼리를 처리할 때 사용하는 분석기를 다르게 설정할 수 있습니다. 이를 통해 색인 시에는 텍스트를 보다 세분화하여 저장하고, 검색 시에는 다르게 텍스트를 처리하여 더 넓은 범위의 문서를 찾을 수 있게 합니다.
```plaintext
{
  "properties": {
    "content": {
      "type": "text",
      "analyzer": "standard",  // 색인 시 사용
      "search_analyzer": "korean"  // 검색 시 사용
    }
  }
}
```
이러한 설정은 검색 엔진의 유연성을 높이고, 다양한 언어나 특수한 요구 사항에 맞춤화된 검색 기능을 제공할 수 있게 해줍니다. 각각의 프로젝트와 요구 사항에 맞춰 적절한 분석기를 선택하고 구성하는 것이 중요합니다.

#### `text` 필드 타입의 주요 매개 변수

##### 1. `analyzer`
Elasticsearch에서 `text` 필드 타입은 주로 자유 형식 텍스트를 처리할 때 사용됩니다. 이 필드 타입에는 몇 가지 중요한 매개변수가 있으며, 그 중에서도 `analyzer`는 특히 중요합니다. `analyzer` 매개변수는 텍스트를 어떻게 분석할지 결정하며, 검색의 정확성과 효율성을 크게 좌우합니다.

###### **`analyzer` 매개변수**
`analyzer` 매개변수는 색인 시 사용할 분석기를 지정합니다. 분석기는 입력된 텍스트를 개별 토큰으로 분해하고, 필요에 따라 이 토큰들을 변환하거나 필터링하는 역할을 합니다. 이 과정은 검색 엔진이 텍스트를 이해하고 적절한 검색 결과를 반환하는 데 필수적입니다.

###### **`search_analyzer` 매개변수**
`search_analyzer`는 검색 쿼리를 처리할 때 사용할 분석기를 지정합니다. 이 매개변수를 명시적으로 설정하지 않을 경우, `analyzer` 매개변수에 지정된 분석기가 검색 시에도 사용됩니다. 즉, 색인과 검색 모두 동일한 분석 방법을 적용합니다. 하지만 때로는 색인 시에는 하나의 분석기를, 검색 시에는 다른 분석기를 사용하는 것이 더 효과적일 수 있습니다. 예를 들어, 색인 시에는 텍스트를 더 세밀하게 분해하는 분석기를 사용하고, 검색 시에는 더 넓은 매칭을 허용하는 분석기를 사용할 수 있습니다.

###### **기본 분석기**
어떠한 `analyzer`도 지정하지 않을 경우, Elasticsearch는 기본적으로 `standard analyzer`를 사용합니다. 이 분석기는 대부분의 유럽 언어에 잘 맞으며, 단어를 토큰화하고, 소문자로 변환하며, 대부분의 구두점을 제거하는 등의 기본적인 텍스트 처리를 수행합니다.

###### **예시**
아래는 `text` 필드에 대한 설정 예시입니다:
```plaintext
{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "english",
      "search_analyzer": "standard"
    }
  }
}
```
이 예에서 `description` 필드는 색인 시에는 `english` 분석기를 사용하여 영어 특유의 언어적 특성을 반영합니다. 검색 시에는 `standard` 분석기를 사용하여 더 일반적인 방식으로 텍스트를 처리합니다. 이러한 설정은 검색 시스템의 유연성을 증가시키고, 텍스트가 색인되고 검색되는 방식을 최적화하여 검색 결과의 정확도와 관련성을 높일 수 있습니다.

##### 2. `fielddata`
Elasticsearch에서 `text` 타입 필드는 기본적으로 전체 텍스트를 토큰화하여 검색에 최적화되도록 설계되어 있습니다. 그러나 이 타입의 필드는 기본적으로 집계(Aggregation)나 정렬(Sorting) 기능을 지원하지 않습니다. 이 때문에 특정 상황에서 `text` 필드를 집계나 정렬에 사용하고 싶을 때 추가 설정이 필요한데, 그 중 하나가 `fielddata` 매개변수입니다.

###### **`fielddata` 매개변수란?**
`fielddata`는 Elasticsearch에서 `text` 필드에 대한 집계나 정렬을 가능하게 하는 설정입니다. 기본적으로 `text` 필드의 `fielddata`는 `false`로 설정되어 있어, 이 필드를 메모리에 로드하여 집계나 정렬을 실행하지 않습니다. 이는 메모리 사용량을 줄이기 위한 조치입니다.

###### **`fielddata` 설정 변경**
만약 `text` 필드에서 집계나 정렬을 수행하고자 한다면, `fielddata`를 `true`로 설정할 수 있습니다. 이렇게 설정하면 Elasticsearch는 해당 필드의 데이터를 메모리에 로드하여 필요한 연산을 수행할 수 있게 됩니다. 그러나 이 설정은 매우 많은 메모리를 소모할 수 있으므로, 성능 저하나 메모리 관련 문제를 일으킬 수 있습니다.
```plaintext
PUT /your_index/_mapping
{
  "properties": {
    "your_text_field": {
      "type": "text",
      "fielddata": true
    }
  }
}
```

###### **대안적 사용 권장사항**
메모리 사용량이 많기 때문에, `fielddata`를 `true`로 설정하는 것보다는 `keyword` 타입의 하위 필드(sub-field)를 사용하는 것을 권장합니다. `keyword` 타입은 집계나 정렬에 적합하게 설계되어 있으며, `text` 필드의 원본 데이터를 그대로 사용하여 집계나 정렬을 수행할 수 있습니다.
```plaintext
{
  "properties": {
    "your_text_field": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    }
  }
}
```
이 설정에서, `your_text_field.keyword`는 원본 텍스트를 변형 없이 저장하며, 필요한 집계나 정렬 작업에 사용될 수 있습니다. 이 방법은 성능 저하를 최소화하고 메모리 사용을 효율적으로 관리할 수 있는 좋은 대안입니다.

이처럼, Elasticsearch에서는 `text` 필드의 사용성을 확장하는 다양한 방법을 제공하지만, 각 옵션의 성능 및 자원 사용에 대한 영향을 고려하여 적절한 설정을 선택하는 것이 중요합니다.

##### 3. `search_analyzer`
Elasticsearch에서 `text` 필드 유형을 사용할 때, `search_analyzer` 매개변수는 검색 시에 사용될 분석기를 지정하는 데 중요한 역할을 합니다. 이 매개변수는 문서가 색인될 때 사용되는 `analyzer`와 동일하거나 다를 수 있으며, 검색 쿼리를 처리하는 방식에 큰 영향을 미칩니다.

###### **`search_analyzer`의 기본 개념**
`search_analyzer`는 검색 시에 적용되는 분석기를 정의합니다. 사용자가 검색 쿼리를 입력했을 때, 이 분석기는 쿼리를 토큰화하고, 필요에 따라 다양한 텍스트 처리를 수행합니다. 이는 색인 시 사용된 `analyzer`와 다를 수 있으며, 검색의 유연성과 정확성을 높이기 위해 맞춤화됩니다.

###### **`search_analyzer` 사용의 예**
예를 들어, 문서 색인 시에는 기본적인 토큰화와 소문자 변환만을 수행하는 `standard analyzer`를 사용하지만, 검색 시에는 동의어 처리를 포함하는 분석기를 사용할 수 있습니다. 이렇게 하면 사용자가 "자동차"라고 검색했을 때 "차량", "승용차" 등의 동의어를 포함한 결과를 반환할 수 있습니다.
```plaintext
{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "standard",
      "search_analyzer": "synonym_analyzer"
    }
  }
}
```

###### **왜 다른 `search_analyzer`를 사용하나요?**
`search_analyzer`를 색인 분석기와 다르게 설정하는 주된 이유는 검색 시 특정 요구를 충족하기 위해서입니다. 다음과 같은 경우에 유용합니다:
- **동의어 처리**: 사용자가 "핸드폰"을 검색했을 때 "스마트폰", "휴대폰" 등의 결과도 함께 보여주고 싶은 경우.
- **다양한 언어 지원**: 다국어 사이트에서 사용자의 언어에 맞는 특수한 처리가 필요할 때.
- **텍스트 정규화**: 검색어의 특정 변형(예: 복수형을 단수형으로 변환)을 처리하고자 할 때.
`search_analyzer`는 Elasticsearch에서 검색 품질을 최적화하기 위한 매우 중요한 도구입니다. 적절한 분석기를 설정함으로써 검색 경험을 개선하고, 사용자의 검색 의도와 더 잘 맞는 결과를 제공할 수 있습니다. 이를 통해 사용자는 원하는 정보를 더 빠르고 정확하게 찾을 수 있습니다.

##### 4. `search_analyzer` 만들기
Elasticsearch에서 `synonym_analyzer` 같은 분석기를 만들기 위해서는 몇 가지 주요 구성 요소를 설정해야 합니다: 토크나이저, 필터(여기서는 특히 동의어 필터), 그리고 필요한 경우 기타 필터들(예를 들어, 소문자 변환). 여기서는 동의어 필터를 포함하는 `synonym_analyzer`를 만드는 방법에 대해 설명하겠습니다.

###### 1. **동의어 파일 준비하기**
동의어 필터를 사용하기 전에 동의어 리스트를 포함하는 파일을 준비해야 합니다. 이 파일은 일반적으로 Elasticsearch의 `config` 디렉토리 안에 위치하며, 각 줄에 하나의 동의어 그룹을 정의합니다. 예를 들어:
```
# synonyms.txt
자동차, 승용차, 차량
핸드폰, 휴대폰, 스마트폰
```
이 파일은 "자동차"를 검색할 때 "승용차"와 "차량"도 결과로 나타나게 하고, "핸드폰"을 검색할 때 "휴대폰"과 "스마트폰"을 결과로 보여주는 데 사용됩니다.

###### 2. **동의어 필터 설정하기**
동의어 필터를 설정하려면 Elasticsearch의 인덱스 설정에서 해당 필터를 정의해야 합니다. 이 예에서는 `synonym` 필터를 추가하고, 위에서 만든 동의어 파일을 참조하도록 설정합니다.
```plaintext
PUT /my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_synonym_filter": {
          "type": "synonym",
          "synonyms_path": "analysis/synonyms.txt"  // 동의어 파일 경로
        }
      },
      "analyzer": {
        "synonym_analyzer": {
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "my_synonym_filter"
          ]
        }
      }
    }
  }
}
```

###### 3. **분석기 사용하기**
위에서 정의한 `synonym_analyzer`를 필드의 `search_analyzer`로 지정하여 사용할 수 있습니다. 다음은 `description` 필드에 이 분석기를 적용하는 방법을 보여줍니다.
```plaintext
PUT /my_index/_mapping
{
  "properties": {
    "description": {
      "type": "text",
      "analyzer": "standard",  // 색인 시 사용하는 기본 분석기
      "search_analyzer": "synonym_analyzer"  // 검색 시 사용하는 분석기
    }
  }
}
```
이 설정을 통해, `description` 필드를 쿼리할 때 입력된 검색어에 대한 동의어도 함께 고려되어 검색 결과가 반환됩니다. 이렇게 하면 검색의 유연성과 정확성을 크게 향상시킬 수 있습니다.

###### **주의사항**
- 동의어 파일의 경로와 이름은 실제 시스템의 경로에 맞게 조정해야 합니다.
- 동의어 리스트는 신중하게 선택하고 관리해야 합니다. 잘못된 동의어 매핑은 검색 결과의 정확성을 저하시킬 수 있습니다.

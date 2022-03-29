
```
curl  /xml-parse\?storeName\=swiftbr\&xmlName\=google_shopping_-xml-_v2\&regionId\=000001\&salesChannel\=1\&storeDomain\=www.swift.com.br -v

curl  /xml-parse\?storeName\=swiftbr\&xmlName\=google_shopping_-xml-_v2\&regionId\=000002\&salesChannel\=3\&storeDomain\=www.swift.com.br -v

curl  /xml-parse\?storeName\=swiftbr\&xmlName\=googleshopping\&regionId\=1\&salesChannel\=1\&storeDomain\=www.swift.com.br -v
```

storeName = Nome do ambiente
xmlName= Nome do XML na VTEX sem extensão
regionId = ID da região que será adicionado ao XML para o Merchant Center
salesChannel = Canal de vendas VTEX que será adicionado as URLs de acesso
storeDomain = Domínio da loja para formação das URLs



regionId

Sp 0001
Rj 0002
Bsb 0003
Go 0004


salesChannel

São Paulo = 1
Distrito Federal = 3
Rio de Janeiro = 4
Goiás = 5

# Endereços dos XMLs de cada região
## São Paulo

https://vtex-xml-transformer.swiftapp.com.br/xml-parse?storeName=swiftbr&xmlName=google_shopping_-xml-_v2&regionId=0001&salesChannel=1&storeDomain=www.swift.com.br


## Distrito Federal

https://vtex-xml-transformer.swiftapp.com.br/xml-parse?storeName=swiftbr&xmlName=google_shopping_-xml-_v2&regionId=0003&salesChannel=3&storeDomain=www.swift.com.br

## Rio de Janeiro

https://vtex-xml-transformer.swiftapp.com.br/xml-parse?storeName=swiftbr&xmlName=google_shopping_-xml-_v2&regionId=0002&salesChannel=4&storeDomain=www.swift.com.br

## Goiás

https://vtex-xml-transformer.swiftapp.com.br/xml-parse?storeName=swiftbr&xmlName=google_shopping_-xml-_v2&regionId=0004&salesChannel=5&storeDomain=www.swift.com.br
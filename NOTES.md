
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
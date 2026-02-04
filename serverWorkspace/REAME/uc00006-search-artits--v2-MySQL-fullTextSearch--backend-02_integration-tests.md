semilar with v2

note: FULL TEST SEARCH FIND WORKDS 
(HANDLES CAPITALS AND WORDS IN SENTENCE)

1. it does not return data if q is empty
   (UNLIKE V1 LIKE THAT DOES FULL TABLE SCAN)
http://localhost:3000/search/v2/artists?q=&offset=0&limit=5


2. it works if you send full name
http://localhost:3000/search/v2/artists?q=Beyoncé&offset=0&limit=5

http://localhost:3000/search/v2/artists?q=Ariana Grande&offset=0&limit=5


3. it works if you send one workd of a sentence
http://localhost:3000/search/v2/artists?q=Ariana&offset=0&limit=5
http://localhost:3000/search/v2/artists?q=Grande&offset=0&limit=5

4. it works if you use small letters 

http://localhost:3000/search/v2/artists?q=ariana grande&offset=0&limit=5



10. it does not work if you send prefix
http://localhost:3000/search/v2/artists?q=Beyonc&offset=0&limit=5

10. it does not work if you send suffix
http://localhost:3000/search/v2/artists?q=eyoncé&offset=0&limit=5
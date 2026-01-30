1. addLike method 
   need to check that the liked entity (aritist\album\playlist) exists
   today: 
   to validate that the liked entity exists,
   we call reposiotry (reading aritsts, albums playlist table on ths likes db)      
   on micorservices:
   the liked aentitry might be on sepreate microserivce (db)
   in that case, we will need to call other ms via http (exists by id)
   
2.

# psql-template

docker exec sonantica-postgres psql -U sonantica -d template1 -p 5444 -c "DROP DATABASE IF EXISTS sonantica;"
docker exec sonantica-postgres psql -U sonantica -d template1 -p 5444 -f /docker-entrypoint-initdb.d/init.sql
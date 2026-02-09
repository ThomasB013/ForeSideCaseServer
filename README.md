# Improvements in this git repo:

- Error handling
- Input validation
- Naming: prepared and total are a bit ambiguous
- Return values from the exposed endpoints are chosen a bit randomly
- Automate generation of TS types from proto file
- Testing is now only done manually via postman

# Improvements with regards to the server deployment (Not in this repo, but writing it down for notes):

- Hide gRCP service from the internet, so that only necessary AWS can construct it.
- Remove raw query passing of testQuery.ts: although it was nice to have during development as it gave full access to the database in an easy way.
- Server is currently being started in root role. This is against principle of least privilege.

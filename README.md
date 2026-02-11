# DOCS

Voor documentatie zie beer.proto

# Improvements in this git repo:

- Automate generation of TS types from proto file.
- Testing is now only done manually via postman.
- (Maybe) Improved error handling: giving error message back in response. Arguments against it: service is purely used by other internal services.

# Improvements with regards to the server deployment (Not in this repo, but writing it down for notes):

- Hide EC2 instance from the internet, so that only necessary AWS can connect to it it.
- Remove raw query passing of testQuery.ts: although it was nice to have during development as it gave full access to the database in an easy way.
- Server is currently being started in root role. This is against principle of least privilege.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

</p>

## Descripción

Backend Proyecto RenTools.

# Instrucciones para levantar el backend
1. Clonar Proyecto
2. Instalar Dependencias
```
npm install
```
3. Clonar el archivo .envxw.template y renombrarlo a .env
4. Rellenar Variables de entorno
5. Levantar la base de datos
```
docker-compose up -d
```
6. Levantar proyecto
```
npm run start:dev
```
7. Ejecutar seed de Usuarios con un GET a:
```
localhost:3000/api/seed
```
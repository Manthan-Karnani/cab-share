FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S cab && adduser -S cab -G cab
COPY --from=build /app/target/campus-cab-1.0.0.jar ./app.jar
USER cab
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

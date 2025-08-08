FROM mariadb:10.11

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_DATABASE=rrcompanion
ENV MYSQL_USER=rrcompanion
ENV MYSQL_PASSWORD=password

# Expose port
EXPOSE 3306 
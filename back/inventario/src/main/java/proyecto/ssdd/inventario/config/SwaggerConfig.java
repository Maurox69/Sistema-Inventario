package proyecto.ssdd.inventario.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Inventario SSDD")
                        .version("1.0.0")
                        .description("Documentación interactiva de los endpoints para el sistema de gestión de activos y consumibles de la oficina.")
                        .contact(new Contact()
                                .name("Mauro")
                                .email("soporte@tuoficina.com")));
    }
}
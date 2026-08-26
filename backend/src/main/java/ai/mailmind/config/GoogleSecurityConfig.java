package ai.mailmind.config;

import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.*;
import java.util.List;

/** Activated only with SPRING_PROFILES_ACTIVE=google and valid Google OAuth credentials. */
@Configuration @Profile("google") public class GoogleSecurityConfig {
 @Value("${app.frontend-url}") String frontendUrl;
 @Bean SecurityFilterChain googleSecurity(HttpSecurity http) throws Exception {
  return http.csrf(csrf->csrf.disable()).cors(c->{}).authorizeHttpRequests(a->a.requestMatchers("/actuator/health").permitAll().anyRequest().authenticated()).exceptionHandling(e->e.defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),new AntPathRequestMatcher("/api/**"))).oauth2Login(o->o.successHandler((request,response,authentication)->response.sendRedirect(frontendUrl))).logout(l->l.logoutUrl("/api/logout").logoutSuccessHandler((request,response,authentication)->response.setStatus(204))).build();
 }
 @Bean CorsConfigurationSource corsConfigurationSource(){var c=new CorsConfiguration();c.setAllowedOrigins(List.of(frontendUrl));c.setAllowedMethods(List.of("GET","POST","PATCH","DELETE","OPTIONS"));c.setAllowedHeaders(List.of("*"));c.setAllowCredentials(true);var source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",c);return source;}
}

import React from 'react'
import { Container, Row, Col } from 'react-bootstrap';

import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";


const TMMTRMain = () => {
    return (
        <Container fluid>
            <Box className="cell p-3 mt-3">
                <Row>
                    <Col className="d-flex align-items-center">
                        <Typography variant="h4" component="h4">
                            TM MTTR Skill
                        </Typography>
                    </Col>

                    <ChartsToolbar />
                </Row>
            </Box>
            <Row className='mb-5'>

                <Col lg={12} md={12} sm={12}>
                    
                </Col>
                <Col lg={12} md={12} sm={12}>
                    
                </Col>
            </Row>
        </Container>
    )
}

export default TMMTRMain